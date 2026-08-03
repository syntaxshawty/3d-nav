import { useCallback, useEffect, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import type { Movement } from './useInput'
import {
  isInsideDeckFootprint,
  STAIR_TOP_POSITION, STAIR_BASE_POSITION, STAIR_DESCEND_YAW, STAIR_ASCEND_YAW,
} from '../data/deckGeometry'
import { isInsideHouseFootprint } from '../data/houseGeometry'
import { SPAWN_POS, SPAWN_YAW } from '../data/spawn'
import { shortestYawDelta } from '../mathUtils'

const SPEED      = 5
const TURN_SPEED = 2.5

// ── Stair transition — scripted walk down/up between the deck and the yard ──
const STAIR_TRANSITION_DURATION = 1.4   // seconds

// 0→1 factor (stairBlendRef) — the cat's downward pitch (AnimatedCat) and the
// camera's look-target offsets (useFollowCamera) use this; eases smoothly
// toward 1/0 over STAIR_BLEND_TIME independent of the transition's own timing.
const STAIR_BLEND_TIME = 0.55  // seconds to ease in/out

// The camera's own orbit (see useFollowCamera) runs on its own independent
// timer — deliberately longer than STAIR_TRANSITION_DURATION, so the camera
// keeps sweeping for a bit even after the character finishes walking down
// and normal control resumes. stairOrbitTRef below is that timer's
// smoothstepped 0→1 progress; useFollowCamera turns it into the actual
// orbit angle/swell.
const STAIR_ORBIT_DURATION = STAIR_TRANSITION_DURATION * 2   // seconds — was too fast at 1x the walk duration

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

// Drives the player's position/yaw each frame: WASD movement + rotation
// confined to the deck footprint, and the scripted stair-transition walk.
// Exposes the refs useFollowCamera, useProximity, and AnimatedCat read.
export function usePlayerController(
  movement: MutableRefObject<Movement>,
  stairActionRef: MutableRefObject<(direction: 'down' | 'up') => void>,
  transitioningRef: MutableRefObject<boolean>,
) {
  const groupRef = useRef<Group>(null!)
  const yawRef = useRef(SPAWN_YAW)
  const movingRef = useRef(false)
  const stairBlendRef = useRef(0)
  const fwdRef = useRef(new Vector3())
  const stairOrbitTRef = useRef(0)

  // Confines WASD movement to the deck's footprint (see isInsideDeckFootprint)
  // until a stair transition takes the player off it. There's no physics
  // collision on the player at all, so this is the only thing stopping them
  // from walking off the deck's edge into open air.
  const onDeck = useRef(true)

  // Scripted stair transition — see stairActionRef below. While active, this
  // replaces WASD-driven movement/rotation entirely for STAIR_TRANSITION_DURATION.
  const scripted        = useRef(false)
  const scriptDirection  = useRef<'down' | 'up'>('down')
  const scriptFrom       = useRef(new Vector3())
  const scriptTo         = useRef(new Vector3())
  const scriptFromYaw    = useRef(0)
  const scriptYawDelta   = useRef(0)
  const scriptElapsed    = useRef(0)

  // The camera orbit runs on its own independent timer (STAIR_ORBIT_DURATION),
  // separate from the scripted walk-down transition (STAIR_TRANSITION_DURATION)
  // — the orbit takes longer than the walk itself, so it keeps sweeping for a
  // bit even after the character finishes walking down and normal control
  // resumes. Started alongside the 'down' transition, runs independently.
  const orbitElapsed = useRef(0)
  const orbitActive  = useRef(false)

  // Write the stair-transition trigger into the ref so GardenView's E-key
  // handler can start it from outside this component.
  useEffect(() => {
    stairActionRef.current = (direction) => {
      if (scripted.current) return
      scriptDirection.current = direction
      scriptFrom.current.copy(groupRef.current.position)
      scriptFromYaw.current = yawRef.current
      if (direction === 'down') {
        scriptTo.current.set(...STAIR_BASE_POSITION)
        scriptYawDelta.current = shortestYawDelta(yawRef.current, STAIR_DESCEND_YAW)
        onDeck.current = false
        orbitElapsed.current = 0
        orbitActive.current  = true
      } else {
        scriptTo.current.set(...STAIR_TOP_POSITION)
        scriptYawDelta.current = shortestYawDelta(yawRef.current, STAIR_ASCEND_YAW)
        onDeck.current = true
      }
      scriptElapsed.current = 0
      scripted.current = true
    }
  }, [stairActionRef])

  useFrame((_state, delta) => {
    const pos = groupRef.current.position
    const m   = movement.current

    if (scripted.current) {
      // ── Scripted stair transition ─────────────────────────────────────────
      // Drives position/yaw directly instead of reading WASD input. The
      // camera (useFollowCamera) still just reads pos/yaw each frame, same as
      // always, so it rides along smoothly with no transition-specific
      // camera code.
      scriptElapsed.current += delta
      const t = Math.min(1, scriptElapsed.current / STAIR_TRANSITION_DURATION)
      const eased = smoothstep(t)
      pos.copy(scriptFrom.current).lerp(scriptTo.current, eased)
      yawRef.current = scriptFromYaw.current + scriptYawDelta.current * eased
      // Kept current here too (normally only updated in the WASD branch
      // below) so the stair-descent look-target offset in useFollowCamera,
      // which reads fwdRef, points the right way during the transition itself.
      fwdRef.current.set(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current))
      if (t >= 1) scripted.current = false
    } else {
      // ── Rotation ────────────────────────────────────────────────────────
      // Note: this group's own rotation is intentionally never set from yaw
      // — yawRef alone drives the camera and movement math, and AnimatedCat
      // (a child of this group) applies its own smoothed turn toward
      // yawRef.current independently, so the visible model eases into turns
      // instead of snapping.
      if (m.left)  yawRef.current += TURN_SPEED * delta
      if (m.right) yawRef.current -= TURN_SPEED * delta

      // ── Forward direction ──────────────────────────────────────────────
      fwdRef.current.set(-Math.sin(yawRef.current), 0, -Math.cos(yawRef.current))

      // ── Movement ──────────────────────────────────────────────────────
      // While on the deck, a step is only taken if it lands inside the
      // footprint; if the full diagonal step doesn't, each axis is tried on
      // its own so walking into an edge at an angle slides along it instead
      // of stopping dead. Once off the deck (in the yard), movement is free
      // — except into the house's footprint, excluded the same way (same
      // per-axis slide-along-the-edge fallback) so the player can't walk
      // through its walls.
      const canStandAt = (x: number, z: number) =>
        (!onDeck.current || isInsideDeckFootprint(x, z)) && !isInsideHouseFootprint(x, z)
      const tryMove = (dx: number, dz: number) => {
        const nx = pos.x + dx
        const nz = pos.z + dz
        if (canStandAt(nx, nz)) { pos.x = nx; pos.z = nz; return }
        if (canStandAt(nx, pos.z)) { pos.x = nx; return }
        if (canStandAt(pos.x, nz)) { pos.z = nz; return }
      }
      if (m.forward)  tryMove(fwdRef.current.x * SPEED * delta,  fwdRef.current.z * SPEED * delta)
      if (m.backward) tryMove(-fwdRef.current.x * SPEED * delta, -fwdRef.current.z * SPEED * delta)
    }

    // ── Stair-camera orbit progress ─────────────────────────────────────────
    // Runs on its own timer independent of `scripted` — see orbitActive's
    // declaration above for why. Stays 0 whenever the orbit hasn't been
    // started or has already finished, exactly like the original inline
    // per-frame local variable did.
    if (orbitActive.current) {
      orbitElapsed.current += delta
      const t = Math.min(1, orbitElapsed.current / STAIR_ORBIT_DURATION)
      stairOrbitTRef.current = smoothstep(t)
      if (t >= 1) orbitActive.current = false
    } else {
      stairOrbitTRef.current = 0
    }

    const isMoving = !scripted.current && (m.forward || m.backward || m.left || m.right)
    // The scripted stair transition also counts as "moving" for animation
    // purposes (the cat should walk, not idle, while it's being carried down
    // the stairs) — kept separate from isMoving itself so useFollowCamera's
    // idle-drift timer/lookahead stay exactly as they were.
    movingRef.current = isMoving || scripted.current

    // ── Stair-descent pose blend ─────────────────────────────────────────────
    // Eases toward 1 while actively descending (scripted transition, 'down'
    // direction only — ascending keeps the normal camera) and back to 0
    // otherwise. Exponential smoothing over STAIR_BLEND_TIME gives a smooth
    // ease in both directions with no snap at either end.
    const stairTarget = scripted.current && scriptDirection.current === 'down' ? 1 : 0
    const stairK = 1 - Math.exp(-delta / STAIR_BLEND_TIME)
    stairBlendRef.current += (stairTarget - stairBlendRef.current) * stairK

    transitioningRef.current = scripted.current
  })

  const reset = useCallback(() => {
    groupRef.current.position.copy(SPAWN_POS)
    yawRef.current         = SPAWN_YAW
    onDeck.current         = true
    scripted.current       = false
    stairBlendRef.current  = 0
    orbitActive.current    = false
    orbitElapsed.current   = 0
  }, [])

  return { groupRef, yawRef, movingRef, stairBlendRef, fwdRef, stairOrbitTRef, reset }
}
