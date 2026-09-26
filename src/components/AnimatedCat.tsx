import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import {
  FrontSide,
  LoopOnce,
  Vector3,
  type Bone,
  type AnimationAction,
  type Group,
  type Mesh,
  type MeshStandardMaterial,
} from 'three';
import { shortestYawDelta } from '../mathUtils';
import { PLANK_THICKNESS, surfaceHeightAt } from '../data/deckGeometry';
import { JUMP_CLIP } from '../systems/deckJump';
import type { PlayerController } from '../systems/playerController';

// The player's visible model — an animated cat, replacing the earlier
// procedural bunny. Sourced from a large general-purpose quadruped
// animation library (124 clips); only the locomotion states this project
// actually drives (idle, forward walk) are used. Clip names below are exact
// matches confirmed against the source file's own clip list. The stairs use
// the ordinary walk cycle too, tilted to the slope (see stairPitchRef); the
// deck-edge jump plays JUMP_CLIP (see deckJump.ts).
const CAT_URL = '/models/cat_animated.glb';
const IDLE_CLIP = 'Idle_1';
const WALK_CLIP = 'Walk_F_IP';
const CROSSFADE_DURATION = 0.3; // seconds, between any two of the above
// Shorter into the jump, so the crouch/push-off isn't blurred by the fade —
// the jump's arc is timed against the clip's own takeoff (deckJump.ts).
const JUMP_CROSSFADE_DURATION = 0.1;

// The raw model loads at real-world cat size (~0.45m tall) with its own
// rest-pose facing, neither of which match this project's child-scaled
// avatar or its -Z-forward convention (see App.tsx) — corrected here rather
// than in the GLB itself.
const CAT_SCALE = 2.1; // brings it roughly to the previous bunny avatar's height
// The player group's own y is the feet-contact reference (DECK_TOP_Y while
// on the deck, 0 on the lawn) — but the deck's actual walkable surface is
// the decorative plank layer sitting PLANK_THICKNESS above that, not the
// structural slab itself. Without this the cat's paws sink slightly into
// the boards. The same small offset is harmless on the lawn/stairs, where
// there's no plank layer to clip into.
const CAT_Y_OFFSET = PLANK_THICKNESS;
const CAT_FACING_YAW = Math.PI; // rest pose faces +Z (toward the camera); this flips it to -Z

const ROTATION_LERP = 0.15; // fraction of the remaining turn closed per ~frame at 60fps

// ── Paw lift ──────────────────────────────────────────────────────────────
// Some clips (the jump especially) push the paws below the model's own
// origin — played in place, a push-off or a reach for the landing has
// nowhere to go but down. Each frame, after the pose is applied, the lowest
// paw is checked against the surface under it (deck, stair tread, or
// ground; see surfaceHeightAt) and the whole model is raised by however far
// it would otherwise sink. Rises instantly (never lets a paw clip), settles
// back down over PAW_LIFT_RELEASE.
const PAW_BONES = ['claw_f.L', 'claw_f.R', 'claw_b.L', 'claw_b.R'];
const PAW_SOLE_HEIGHT = 0.016 * CAT_SCALE; // paw bones' rest height above the model's origin — where the pad actually meets the ground
const PAW_LIFT_TOLERANCE = 0.01; // ignore sub-centimeter dips, so ordinary walking never jitters
const PAW_LIFT_RELEASE = 0.08; // seconds to ease back down once a paw is clear
// How far above the cat's origin a surface can be and still count as under
// it — keeps the deck top from "catching" a cat walking beside it on the lawn.
const PAW_SURFACE_REACH = 0.3;
const _pawPos = new Vector3();

export function AnimatedCat({
  yawRef,
  movingRef,
  stairPitchRef,
  jumpingRef,
  playerRef,
}: {
  yawRef: MutableRefObject<number>;
  movingRef: MutableRefObject<boolean>;
  // Nose-down tilt (radians) while on the stairs, from usePlayerController —
  // 0 everywhere else.
  stairPitchRef: MutableRefObject<number>;
  // True for the deck-edge jump's duration — plays JUMP_CLIP over
  // everything else.
  jumpingRef: MutableRefObject<boolean>;
  // playerRef.current.playAnimation is written here so GardenView's E-key
  // handler can play a one-shot clip (e.g. SharpenClaws_Vert) from outside
  // this component — same pattern as usePlayerController's useStairs.
  // playerRef.current.animationLock is set true for the one-shot's
  // duration; usePlayerController reads it to freeze WASD movement/
  // rotation meanwhile, so it's owned jointly with this component rather
  // than being purely local state here.
  playerRef: MutableRefObject<PlayerController>;
}) {
  const groupRef = useRef<Group>(null!);
  const { scene, animations } = useGLTF(CAT_URL);
  const { actions } = useAnimations(animations, groupRef);

  // The model's own visual facing, eased toward yawRef.current each frame —
  // kept separate from yawRef itself, which the controller (App.tsx) turns
  // instantly for movement/camera purposes.
  const facingYaw = useRef(0);
  // Name of whichever of IDLE_CLIP/WALK_CLIP/JUMP_CLIP is currently
  // playing — crossfades to a new one only when the target actually changes.
  const currentClipRef = useRef(IDLE_CLIP);
  const pawBones = useRef<Bone[]>([]);
  const pawLift = useRef(0);

  // Seeds facingYaw from the controller's actual starting yaw instead of the
  // 0 placeholder above, so the model doesn't visibly spin from a wrong
  // assumed default if spawn yaw is ever non-zero. Reading yawRef.current
  // directly during render (as useRef's lazy initializer) isn't safe — render
  // can run more than once — so this reads it here instead, in a layout
  // effect that's guaranteed to run before the first paint and before
  // useFrame's first tick, so there's no visible frame with the wrong value.
  useLayoutEffect(() => {
    facingYaw.current = yawRef.current;
  }, [yawRef]);

  // The source material is authored with alphaMode=BLEND (transparent=true,
  // depthWrite=false) despite opacity=1 and no alphaMap — a leftover from
  // the source file, not an intentional cutout. Forced opaque here. (A
  // separate pale-strip artifact on the rear legs turned out to be
  // overlapping fur-card geometry baked into the mesh itself, not a
  // material/alpha issue — fixed by switching to the source export that
  // omits those cards, not by anything here. There's exactly one mesh and
  // one material in this asset, so this correction applies to the whole
  // model safely.)
  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as Partial<Mesh>;
      if (!mesh.isMesh || !mesh.material) return;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      mats.forEach((m) => {
        const mat = m as MeshStandardMaterial;
        mat.transparent = false;
        mat.opacity = 1;
        mat.alphaTest = 0;
        mat.depthWrite = true;
        mat.depthTest = true;
        mat.side = FrontSide;
        mat.needsUpdate = true;
      });
    });
  }, [scene]);

  useEffect(() => {
    pawBones.current = PAW_BONES.map(
      (name) => scene.getObjectByName(name) as Bone,
    ).filter(Boolean);
  }, [scene]);

  useEffect(() => {
    actions[IDLE_CLIP]?.reset().play();
    return () => {
      Object.values(actions).forEach((action) => action?.stop());
    };
  }, [actions]);

  // Whichever of jump/walk/idle applies right now — movingRef is also true
  // during the scripted stair transition, so the cat walks up/down the stairs.
  const resolveLocomotionClip = useCallback(
    () =>
      jumpingRef.current
        ? JUMP_CLIP
        : movingRef.current
          ? WALK_CLIP
          : IDLE_CLIP,
    [jumpingRef, movingRef],
  );

  // One-shot interaction animations (e.g. SharpenClaws_Vert) — plays a clip
  // once over the current locomotion state, then hands back to it. Ignored
  // while one is already playing (playerRef.current.animationLock) or if
  // the clip name doesn't exist in this asset, rather than restarting/crashing.
  useEffect(() => {
    playerRef.current.playAnimation = (clip: string) => {
      if (playerRef.current.animationLock) return;
      const action = actions[clip];
      if (!action) return;

      playerRef.current.animationLock = true;
      actions[currentClipRef.current]?.fadeOut(CROSSFADE_DURATION);
      action.reset();
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      action.fadeIn(CROSSFADE_DURATION).play();

      const mixer = action.getMixer();
      const onFinished = (event: { action: AnimationAction }) => {
        if (event.action !== action) return;
        mixer.removeEventListener('finished', onFinished);
        playerRef.current.animationLock = false;
        const resumeClip = resolveLocomotionClip();
        actions[resumeClip]?.reset().fadeIn(CROSSFADE_DURATION).play();
        currentClipRef.current = resumeClip;
      };
      mixer.addEventListener('finished', onFinished);
    };
  }, [actions, playerRef, resolveLocomotionClip]);

  useFrame((_state, delta) => {
    // ── Crossfade between idle/walk/jump on state change ───────────────────
    // Skipped entirely while a one-shot interaction animation owns the mixer.
    if (!playerRef.current.animationLock) {
      const targetClip = resolveLocomotionClip();
      if (targetClip !== currentClipRef.current) {
        const fade =
          targetClip === JUMP_CLIP
            ? JUMP_CROSSFADE_DURATION
            : CROSSFADE_DURATION;
        actions[currentClipRef.current]?.fadeOut(fade);
        const action = actions[targetClip]?.reset();
        if (targetClip === JUMP_CLIP) {
          action?.setLoop(LoopOnce, 1);
          if (action) action.clampWhenFinished = true;
        }
        action?.fadeIn(fade).play();
        currentClipRef.current = targetClip;
      }
    }

    // ── Smoothly turn the visible model toward the controller's yaw ───────
    const target = yawRef.current + CAT_FACING_YAW;
    const step = Math.min(1, ROTATION_LERP * delta * 60);
    facingYaw.current += shortestYawDelta(facingYaw.current, target) * step;
    groupRef.current.rotation.y = facingYaw.current;
    // Pitch about the model's own (post-yaw) side axis — see the 'YXZ'
    // rotation order on the group below.
    groupRef.current.rotation.x = stairPitchRef.current;

    // ── Paw lift (see PAW_BONES above) ─────────────────────────────────────
    // Measured with the lift removed, so it's the raw sink depth this frame.
    // drei's useAnimations registered its mixer update before this useFrame,
    // so the bones already hold this frame's pose.
    const group = groupRef.current;
    group.position.y = CAT_Y_OFFSET;
    group.updateMatrixWorld(true);
    const originY = group.getWorldPosition(_pawPos).y;
    let sink = 0;
    for (const bone of pawBones.current) {
      bone.getWorldPosition(_pawPos);
      const surface = surfaceHeightAt(
        _pawPos.x,
        _pawPos.z,
        originY + PAW_SURFACE_REACH,
      );
      sink = Math.max(sink, surface - (_pawPos.y - PAW_SOLE_HEIGHT));
    }
    const liftTarget = sink > PAW_LIFT_TOLERANCE ? sink : 0;
    pawLift.current =
      liftTarget >= pawLift.current
        ? liftTarget
        : pawLift.current +
          (liftTarget - pawLift.current) *
            (1 - Math.exp(-delta / PAW_LIFT_RELEASE));
    group.position.y = CAT_Y_OFFSET + pawLift.current;
  });

  return (
    <group
      ref={groupRef}
      position={[0, CAT_Y_OFFSET, 0]}
      rotation={[0, 0, 0, 'YXZ']}
      scale={CAT_SCALE}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(CAT_URL);
