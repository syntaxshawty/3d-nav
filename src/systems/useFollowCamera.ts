import { useCallback, useRef, type MutableRefObject, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import type { Movement } from './useInput'
import { useMouseLook } from './useMouseLook'
import {
  CAMERA_DISTANCE, CAMERA_HEIGHT, CAMERA_TARGET_OFFSET,
  SPAWN_CAM_POS, SPAWN_LOOK_TARGET,
} from '../data/spawn'

const CAMERA_PITCH = 0.03  // default downward tilt (radians) when the player isn't looking around — kept minimal since the raised target already angles the view down toward the avatar

// ── Mouse look — right-drag or Alt+drag tilts the camera up/down ───────────
const PITCH_MIN = -0.5   // clamped look-up limit (radians)
const PITCH_MAX = 0.7    // clamped look-down limit (radians)
const MOUSE_LOOK_SENSITIVITY = 0.003  // pitch radians per pixel of mouse movement while looking

const CAM_LERP       = 0.08
const LOOKAHEAD_DIST = 2.5
const LOOKAHEAD_LERP = 0.05

const IDLE_TIMEOUT = 1.0
const DRIFT_H      = 0.15
const DRIFT_V      = 0.08
const DRIFT_SPEED  = 0.6

// ── Stair descent camera path — only while actively descending ─────────────
// The look-target gains an extra forward/down offset (scaled by
// usePlayerController's stairBlendRef), and the camera angle itself orbits a
// full circle around the cat over usePlayerController's independent
// stairOrbitTRef timer, instead of just pulling back. Distance/height swell
// out via sin(stairOrbitT * π) — zero at both ends, peaking at the midpoint —
// so the orbit smoothly balloons out and settles back to exactly the normal
// follow position as it finishes, with no separate blend-out needed.
const STAIR_LOOK_FORWARD_OFFSET    = 1.6   // extra look-target distance toward the stair bottom, at full blend
const STAIR_LOOK_DOWN_OFFSET       = 0.9   // extra downward look-target offset, at full blend
const STAIR_ORBIT_TURNS            = -1    // full revolutions over the orbit — negative sweeps clockwise (viewed from above)
const STAIR_ORBIT_HEIGHT_OFFSET    = 1.1   // extra camera height at the midpoint of the orbit
const STAIR_ORBIT_DISTANCE_OFFSET  = 1.6   // extra camera distance from the cat at the midpoint of the orbit

// Follows the player: standard behind-the-shoulder tracking with idle drift
// sway, plus the stair-descent look-target offset/camera orbit driven by
// usePlayerController's stairBlendRef/stairOrbitTRef.
export function useFollowCamera(
  groupRef: RefObject<Group>,
  yawRef: MutableRefObject<number>,
  fwdRef: MutableRefObject<Vector3>,
  stairBlendRef: MutableRefObject<number>,
  stairOrbitTRef: MutableRefObject<number>,
  movement: MutableRefObject<Movement>,
  transitioningRef: MutableRefObject<boolean>,
) {
  const pitch = useMouseLook(CAMERA_PITCH, PITCH_MIN, PITCH_MAX, MOUSE_LOOK_SENSITIVITY)

  const camPosRef     = useRef(SPAWN_CAM_POS.clone())
  const lookTargetRef = useRef(SPAWN_LOOK_TARGET.clone())
  const idleTime        = useRef(0)
  const driftActiveRef  = useRef(false)

  const _targetCam = useRef(new Vector3())
  const _lookahead = useRef(new Vector3())

  useFrame((state, delta) => {
    const pos = groupRef.current.position
    const m   = movement.current
    // Recomputed the same way usePlayerController derives its own isMoving
    // (not scripted, and some WASD key held) — deterministic from the same
    // inputs, so this stays in sync without needing an extra shared ref.
    const isMoving = !transitioningRef.current && (m.forward || m.backward || m.left || m.right)

    // ── Idle timer ─────────────────────────────────────────────────────────
    if (isMoving) {
      idleTime.current       = 0
      driftActiveRef.current = false
    } else {
      idleTime.current += delta
      if (idleTime.current >= IDLE_TIMEOUT) driftActiveRef.current = true
    }

    // ── Look-ahead ─────────────────────────────────────────────────────────
    // The stair-descent forward offset piggybacks on the same fwdRef-scaled
    // term as the ordinary lookahead; the downward offset lowers the target
    // height directly, together shifting the look target toward the bottom
    // of the stairs as the blend comes in.
    const lookaheadScale = (isMoving && m.forward ? LOOKAHEAD_DIST : 0) + STAIR_LOOK_FORWARD_OFFSET * stairBlendRef.current
    _lookahead.current.set(
      pos.x + fwdRef.current.x * lookaheadScale,
      pos.y + CAMERA_TARGET_OFFSET - STAIR_LOOK_DOWN_OFFSET * stairBlendRef.current,
      pos.z + fwdRef.current.z * lookaheadScale,
    )
    lookTargetRef.current.lerp(_lookahead.current, LOOKAHEAD_LERP)

    // ── Camera ─────────────────────────────────────────────────────────────
    const stairOrbitT = stairOrbitTRef.current
    const orbitAngle = stairOrbitT * Math.PI * 2 * STAIR_ORBIT_TURNS
    const orbitSwell = Math.sin(stairOrbitT * Math.PI)
    const camAngle        = yawRef.current + orbitAngle
    const stairCamDistance = CAMERA_DISTANCE + STAIR_ORBIT_DISTANCE_OFFSET * orbitSwell
    _targetCam.current.set(
      pos.x + Math.sin(camAngle) * stairCamDistance,
      pos.y + CAMERA_HEIGHT + STAIR_ORBIT_HEIGHT_OFFSET * orbitSwell,
      pos.z + Math.cos(camAngle) * stairCamDistance,
    )
    if (driftActiveRef.current) {
      const t = state.clock.elapsedTime
      _targetCam.current.x += Math.sin(t * DRIFT_SPEED)       * DRIFT_H
      _targetCam.current.y += Math.sin(t * DRIFT_SPEED * 0.7) * DRIFT_V
    }
    const lerpT = Math.min(1, CAM_LERP * delta * 60)
    camPosRef.current.lerp(_targetCam.current, lerpT)
    state.camera.position.copy(camPosRef.current)
    state.camera.lookAt(lookTargetRef.current)
    // Extra tilt layered on top of the look-at, purely for framing — doesn't
    // change where the camera is aimed relative to the player. Defaults to
    // CAMERA_PITCH; right-drag/Alt-drag (useMouseLook) adjusts it within
    // [PITCH_MIN, PITCH_MAX].
    state.camera.rotateX(-pitch.current)
  })

  const reset = useCallback(() => {
    camPosRef.current.copy(SPAWN_CAM_POS)
    lookTargetRef.current.copy(SPAWN_LOOK_TARGET)
    idleTime.current       = 0
    driftActiveRef.current = false
  }, [])

  return { camPosRef, driftActiveRef, reset }
}
