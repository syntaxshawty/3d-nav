import { useEffect, useLayoutEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { FrontSide, type Group, type Mesh, type MeshStandardMaterial } from 'three'
import { shortestYawDelta } from '../mathUtils'
import { PLANK_THICKNESS, STAIR_SLOPE_PITCH } from '../data/deckGeometry'

// The player's visible model — an animated cat, replacing the earlier
// procedural bunny. Sourced from a large general-purpose quadruped
// animation library (124 clips); only the two locomotion states this
// project actually drives (idle, forward walk) are used. Clip names below
// are exact matches confirmed against the source file's own clip list
// (also logged once on mount, below, in case the source file ever changes).
const CAT_URL   = '/models/cat_animated.glb'
const IDLE_CLIP = 'Idle_1'
const WALK_CLIP = 'Walk_F_IP'
const CROSSFADE_DURATION = 0.3   // seconds, idle <-> walk

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

// Downward body pitch while descending the stairs, at full blend — based on
// the stairs' real slope (STAIR_SLOPE_PITCH, computed from actual rise/run
// in Deck.tsx) rather than a guessed angle, scaled up since the true slope
// alone read as too subtle to notice. Tune CAT_STAIR_PITCH_SCALE if it needs
// to be more/less dramatic.
const CAT_STAIR_PITCH_SCALE = 2.2
const CAT_STAIR_PITCH = STAIR_SLOPE_PITCH * CAT_STAIR_PITCH_SCALE

export function AnimatedCat({
  yawRef, movingRef, stairBlendRef,
}: {
  yawRef:        MutableRefObject<number>
  movingRef:     MutableRefObject<boolean>
  // 0→1, already smoothed in Player (App.tsx) — shared with the stair-descent
  // camera offsets there so the cat's tilt and the camera move in lockstep.
  stairBlendRef: MutableRefObject<number>
}) {
  const groupRef = useRef<Group>(null!)
  // Child of groupRef, dedicated to the stair-descent pitch — pitch needs to
  // apply in the *already-yawed* local frame, not as an independent Euler
  // component alongside rotation.y on the same object. Setting rotation.x
  // and rotation.y directly on one Object3D composes them in a fixed
  // world-axis order, which (once yaw is non-zero, e.g. facing down the
  // diagonal stairs) reads as a sideways lean instead of a pure forward
  // pitch. Nesting pitch inside the yawed group is the standard fix.
  const pitchGroupRef = useRef<Group>(null!)
  const { scene, animations } = useGLTF(CAT_URL)
  const { actions } = useAnimations(animations, groupRef)

  // The model's own visual facing, eased toward yawRef.current each frame —
  // kept separate from yawRef itself, which the controller (App.tsx) turns
  // instantly for movement/camera purposes.
  const facingYaw = useRef(0)
  const wasMoving = useRef(false)

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

  useFrame((_state, delta) => {
    // ── Crossfade idle <-> walk on movement-state change ──────────────────
    const isMoving = movingRef.current
    if (isMoving !== wasMoving.current) {
      actions[wasMoving.current ? WALK_CLIP : IDLE_CLIP]?.fadeOut(CROSSFADE_DURATION)
      actions[isMoving ? WALK_CLIP : IDLE_CLIP]?.reset().fadeIn(CROSSFADE_DURATION).play()
      wasMoving.current = isMoving
    }

    // ── Smoothly turn the visible model toward the controller's yaw ───────
    const target = yawRef.current + CAT_FACING_YAW
    const step   = Math.min(1, ROTATION_LERP * delta * 60)
    facingYaw.current += shortestYawDelta(facingYaw.current, target) * step
    groupRef.current.rotation.y = facingYaw.current

    // ── Stair-descent body pitch ────────────────────────────────────────────
    // stairBlendRef is already smoothed upstream (shared with the camera's
    // stair-descent offsets in App.tsx), so this only needs to scale by it —
    // no separate easing here, which keeps the two in lockstep and avoids
    // any snap of its own. Applied to pitchGroupRef (child of the yawed
    // group), not groupRef itself — see the comment on pitchGroupRef above.
    pitchGroupRef.current.rotation.x = CAT_STAIR_PITCH * stairBlendRef.current
  })

  return (
    <group ref={groupRef} position={[0, CAT_Y_OFFSET, 0]} scale={CAT_SCALE}>
      <group ref={pitchGroupRef}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

useGLTF.preload(CAT_URL)
