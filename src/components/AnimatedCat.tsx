import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import {
  FrontSide, LoopOnce,
  type AnimationAction, type Group, type Mesh, type MeshStandardMaterial,
} from 'three'
import { shortestYawDelta } from '../mathUtils'
import { PLANK_THICKNESS } from '../data/deckGeometry'

// The player's visible model — an animated cat, replacing the earlier
// procedural bunny. Sourced from a large general-purpose quadruped
// animation library (124 clips); only the locomotion states this project
// actually drives (idle, forward walk, stair jump) are used. Clip names
// below are exact matches confirmed against the source file's own clip list.
const CAT_URL   = '/models/cat_animated.glb'
const IDLE_CLIP  = 'Idle_1'
const WALK_CLIP  = 'Walk_F_IP'
// Plays for the scripted stair transition's duration (both directions)
// instead of the normal walk cycle — see stairActiveRef below.
const STAIR_CLIP = 'JumpFw_IP'
const CROSSFADE_DURATION = 0.3   // seconds, between any two of the above

// The raw model loads at real-world cat size (~0.45m tall) with its own
// rest-pose facing, neither of which match this project's child-scaled
// avatar or its -Z-forward convention (see App.tsx) — corrected here rather
// than in the GLB itself.
const CAT_SCALE      = 2.1   // brings it roughly to the previous bunny avatar's height
// The player group's own y is the feet-contact reference (DECK_TOP_Y while
// on the deck, 0 on the lawn) — but the deck's actual walkable surface is
// the decorative plank layer sitting PLANK_THICKNESS above that, not the
// structural slab itself. Without this the cat's paws sink slightly into
// the boards. The same small offset is harmless on the lawn/stairs, where
// there's no plank layer to clip into.
const CAT_Y_OFFSET   = PLANK_THICKNESS
const CAT_FACING_YAW = Math.PI   // rest pose faces +Z (toward the camera); this flips it to -Z

const ROTATION_LERP = 0.15   // fraction of the remaining turn closed per ~frame at 60fps

export function AnimatedCat({
  yawRef, movingRef, stairActiveRef, playAnimationRef, animationLockRef,
}: {
  yawRef:        MutableRefObject<number>
  movingRef:     MutableRefObject<boolean>
  // True for the scripted stair transition's duration (both directions) —
  // takes priority over movingRef so JumpFw_IP plays instead of the normal
  // walk cycle while it's carrying the player up/down.
  stairActiveRef: MutableRefObject<boolean>
  // Written here so GardenView's E-key handler can play a one-shot clip
  // (e.g. SharpenClaws_Vert) from outside this component — same pattern as
  // usePlayerController's stairActionRef.
  playAnimationRef: MutableRefObject<(clip: string) => void>
  // Set true for the one-shot's duration; usePlayerController reads it to
  // freeze WASD movement/rotation meanwhile, so it's owned jointly with
  // this component rather than being purely local state here.
  animationLockRef: MutableRefObject<boolean>
}) {
  const groupRef = useRef<Group>(null!)
  const { scene, animations } = useGLTF(CAT_URL)
  const { actions } = useAnimations(animations, groupRef)

  // The model's own visual facing, eased toward yawRef.current each frame —
  // kept separate from yawRef itself, which the controller (App.tsx) turns
  // instantly for movement/camera purposes.
  const facingYaw = useRef(0)
  // Name of whichever of IDLE_CLIP/WALK_CLIP/STAIR_CLIP is currently
  // playing — crossfades to a new one only when the target actually
  // changes, so idle/walk/stair-jump all share one switch instead of each
  // pair needing its own boolean.
  const currentClipRef = useRef(IDLE_CLIP)

  // Seeds facingYaw from the controller's actual starting yaw instead of the
  // 0 placeholder above, so the model doesn't visibly spin from a wrong
  // assumed default if spawn yaw is ever non-zero. Reading yawRef.current
  // directly during render (as useRef's lazy initializer) isn't safe — render
  // can run more than once — so this reads it here instead, in a layout
  // effect that's guaranteed to run before the first paint and before
  // useFrame's first tick, so there's no visible frame with the wrong value.
  useLayoutEffect(() => {
    facingYaw.current = yawRef.current
  }, [yawRef])

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
    scene.traverse(obj => {
      const mesh = obj as Partial<Mesh>
      if (!mesh.isMesh || !mesh.material) return
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach(m => {
        const mat = m as MeshStandardMaterial
        mat.transparent = false
        mat.opacity     = 1
        mat.alphaTest   = 0
        mat.depthWrite  = true
        mat.depthTest   = true
        mat.side        = FrontSide
        mat.needsUpdate = true
      })
    })
  }, [scene])

  useEffect(() => {
    actions[IDLE_CLIP]?.reset().play()
    return () => {
      Object.values(actions).forEach(action => action?.stop())
    }
  }, [actions])

  // Whichever of idle/walk/stair-jump applies right now, in priority order —
  // stairActiveRef wins over movingRef since the scripted transition also
  // sets movingRef true (the cat should visibly travel, not idle, while
  // being carried up/down).
  const resolveLocomotionClip = useCallback(
    () => (stairActiveRef.current ? STAIR_CLIP : movingRef.current ? WALK_CLIP : IDLE_CLIP),
    [stairActiveRef, movingRef],
  )

  // One-shot interaction animations (e.g. SharpenClaws_Vert) — plays a clip
  // once over the current locomotion state, then hands back to it. Ignored
  // while one is already playing (animationLockRef.current) or if the clip
  // name doesn't exist in this asset, rather than restarting/crashing.
  useEffect(() => {
    playAnimationRef.current = (clip: string) => {
      if (animationLockRef.current) return
      const action = actions[clip]
      if (!action) return

      animationLockRef.current = true
      actions[currentClipRef.current]?.fadeOut(CROSSFADE_DURATION)
      action.reset()
      action.setLoop(LoopOnce, 1)
      action.clampWhenFinished = true
      action.fadeIn(CROSSFADE_DURATION).play()

      const mixer = action.getMixer()
      const onFinished = (event: { action: AnimationAction }) => {
        if (event.action !== action) return
        mixer.removeEventListener('finished', onFinished)
        animationLockRef.current = false
        const resumeClip = resolveLocomotionClip()
        actions[resumeClip]?.reset().fadeIn(CROSSFADE_DURATION).play()
        currentClipRef.current = resumeClip
      }
      mixer.addEventListener('finished', onFinished)
    }
  }, [actions, playAnimationRef, animationLockRef, resolveLocomotionClip])

  useFrame((_state, delta) => {
    // ── Crossfade between idle/walk/stair-jump on state change ────────────
    // Skipped entirely while a one-shot interaction animation owns the mixer.
    if (!animationLockRef.current) {
      const targetClip = resolveLocomotionClip()
      if (targetClip !== currentClipRef.current) {
        actions[currentClipRef.current]?.fadeOut(CROSSFADE_DURATION)
        actions[targetClip]?.reset().fadeIn(CROSSFADE_DURATION).play()
        currentClipRef.current = targetClip
      }
    }

    // ── Smoothly turn the visible model toward the controller's yaw ───────
    const target = yawRef.current + CAT_FACING_YAW
    const step   = Math.min(1, ROTATION_LERP * delta * 60)
    facingYaw.current += shortestYawDelta(facingYaw.current, target) * step
    groupRef.current.rotation.y = facingYaw.current
  })

  return (
    <group ref={groupRef} position={[0, CAT_Y_OFFSET, 0]} scale={CAT_SCALE}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(CAT_URL)
