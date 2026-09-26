import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import type { Movement } from './useInput';
import {
  isInsideDeckFootprint,
  STAIR_TOP_POSITION,
  STAIR_BASE_POSITION,
  STAIR_DESCEND_YAW,
  STAIR_ASCEND_YAW,
  stairDistance,
  stairPathY,
} from '../data/deckGeometry';
import { isInsideHouseFootprint } from '../data/houseGeometry';
import {
  crouchProgress,
  JUMP_END_TIME,
  jumpArcY,
  jumpProgress,
  planJump,
} from './deckJump';
import { SPAWN_POS, SPAWN_YAW } from '../data/spawn';
import { shortestYawDelta } from '../mathUtils';
import type { PlayerController } from './playerController';

const SPEED = 5;
const TURN_SPEED = 2.5;

// ── Stair transition — scripted walk down/up between the deck and the yard ──
const STAIR_TRANSITION_DURATION = 1.8; // seconds — an unhurried walk, not a leap

// Roughly how far the cat's front/back paws sit from its origin at
// AnimatedCat's CAT_SCALE (front ~0.3, back ~0.4, from the skeleton's foot
// bones) — used to rest both ends of the body on the stair path, and to tilt
// it to match, so neither pair of paws sinks into a step.
const PAW_HALF_SPAN = 0.4;

// 0→1 factor (stairBlendRef) — the camera's look-target offsets
// (useFollowCamera) use this; eases smoothly toward 1/0 over STAIR_BLEND_TIME
// independent of the transition's own timing.
const STAIR_BLEND_TIME = 0.55; // seconds to ease in/out

// The camera's gentle pull-back on the way down (see useFollowCamera) runs on
// its own timer: stairCameraTRef below is its smoothstepped 0→1 progress,
// which useFollowCamera turns into a swell out and back.
const STAIR_CAMERA_DURATION = STAIR_TRANSITION_DURATION; // seconds

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

// Drives the player's position/yaw each frame: WASD movement + rotation
// confined to the deck footprint, and the scripted stair-transition walk.
// Exposes the refs useFollowCamera, useProximity, and AnimatedCat read.
export function usePlayerController(
  movement: MutableRefObject<Movement>,
  playerRef: MutableRefObject<PlayerController>,
) {
  const groupRef = useRef<Group>(null!);
  const yawRef = useRef(SPAWN_YAW);
  const movingRef = useRef(false);
  const stairBlendRef = useRef(0);
  const fwdRef = useRef(new Vector3());
  const stairCameraTRef = useRef(0);
  // Nose-down tilt (radians) of the cat while on the stairs, so its body
  // follows the slope — AnimatedCat applies it. 0 everywhere else.
  const stairPitchRef = useRef(0);

  // Confines WASD movement to the deck's footprint (see isInsideDeckFootprint)
  // until a stair transition takes the player off it. There's no physics
  // collision on the player at all, so this is the only thing stopping them
  // from walking off the deck's edge into open air.
  const onDeck = useRef(true);

  // Scripted stair transition — see playerRef.current.useStairs below. While
  // active, this replaces WASD-driven movement/rotation entirely for
  // STAIR_TRANSITION_DURATION.
  const scripted = useRef(false);
  const scriptDirection = useRef<'down' | 'up'>('down');
  const scriptFrom = useRef(new Vector3());
  const scriptTo = useRef(new Vector3());
  const scriptFromYaw = useRef(0);
  const scriptYawDelta = useRef(0);
  const scriptElapsed = useRef(0);

  // Jump off a yard-facing deck edge — see playerRef.current.jumpDown below
  // and deckJump.ts. Like the stair transition, replaces WASD entirely while
  // it plays; exposed as jumpingRef so AnimatedCat plays the jump clip.
  const jumping = useRef(false);
  const jumpFrom = useRef(new Vector3());
  const jumpTo = useRef(new Vector3());
  const jumpFromYaw = useRef(0);
  const jumpYawDelta = useRef(0);
  const jumpElapsed = useRef(0);

  // The camera pull-back's timer (STAIR_CAMERA_DURATION) — started alongside
  // the 'down' transition, runs independently of it.
  const cameraElapsed = useRef(0);
  const cameraActive = useRef(false);

  // Write the stair-transition trigger into the ref so GardenView's E-key
  // handler can start it from outside this component.
  useEffect(() => {
    playerRef.current.useStairs = (direction) => {
      if (scripted.current) return;
      scriptDirection.current = direction;
      scriptFrom.current.copy(groupRef.current.position);
      scriptFromYaw.current = yawRef.current;
      if (direction === 'down') {
        scriptTo.current.set(...STAIR_BASE_POSITION);
        scriptYawDelta.current = shortestYawDelta(
          yawRef.current,
          STAIR_DESCEND_YAW,
        );
        onDeck.current = false;
        cameraElapsed.current = 0;
        cameraActive.current = true;
      } else {
        scriptTo.current.set(...STAIR_TOP_POSITION);
        scriptYawDelta.current = shortestYawDelta(
          yawRef.current,
          STAIR_ASCEND_YAW,
        );
        onDeck.current = true;
      }
      scriptElapsed.current = 0;
      scripted.current = true;
    };

    playerRef.current.jumpDown = () => {
      if (scripted.current || jumping.current) return;
      const pos = groupRef.current.position;
      const plan = planJump(
        pos.x,
        pos.y,
        pos.z,
        fwdRef.current.x,
        fwdRef.current.z,
      );
      if (!plan) return;
      jumpFrom.current.copy(pos);
      jumpTo.current.set(plan.toX, 0, plan.toZ);
      jumpFromYaw.current = yawRef.current;
      jumpYawDelta.current = shortestYawDelta(yawRef.current, plan.yaw);
      jumpElapsed.current = 0;
      jumping.current = true;
      onDeck.current = false;
    };
  }, [playerRef]);

  useFrame((_state, delta) => {
    const pos = groupRef.current.position;
    const m = movement.current;

    if (scripted.current) {
      // ── Scripted stair transition ─────────────────────────────────────────
      // Drives position/yaw directly instead of reading WASD input. The
      // camera (useFollowCamera) still just reads pos/yaw each frame, same as
      // always, so it rides along smoothly with no transition-specific
      // camera code.
      scriptElapsed.current += delta;
      const t = Math.min(1, scriptElapsed.current / STAIR_TRANSITION_DURATION);
      const eased = smoothstep(t);
      pos.x =
        scriptFrom.current.x +
        (scriptTo.current.x - scriptFrom.current.x) * eased;
      pos.z =
        scriptFrom.current.z +
        (scriptTo.current.z - scriptFrom.current.z) * eased;
      // Height comes from the stair path rather than a straight lerp: the
      // front and back paws each rest on it, the body sits midway between
      // them, and tilts to match — so every paw stays on a tread or the
      // deck instead of cutting through the steps.
      const d = stairDistance(pos.x, pos.z);
      const facing = scriptDirection.current === 'down' ? 1 : -1;
      const frontY = stairPathY(d + facing * PAW_HALF_SPAN);
      const backY = stairPathY(d - facing * PAW_HALF_SPAN);
      pos.y = (frontY + backY) / 2;
      stairPitchRef.current = Math.atan2(backY - frontY, PAW_HALF_SPAN * 2);
      yawRef.current = scriptFromYaw.current + scriptYawDelta.current * eased;
      // Kept current here too (normally only updated in the WASD branch
      // below) so the stair-descent look-target offset in useFollowCamera,
      // which reads fwdRef, points the right way during the transition itself.
      fwdRef.current.set(
        -Math.sin(yawRef.current),
        0,
        -Math.cos(yawRef.current),
      );
      if (t >= 1) {
        scripted.current = false;
        stairPitchRef.current = 0;
      }
    } else if (jumping.current) {
      // ── Jump off the deck edge ────────────────────────────────────────────
      // Timed against the jump clip (deckJump.ts): turn to face straight out
      // while crouching, then follow the arc from takeoff to touchdown, then
      // stand at the landing spot while the clip settles.
      jumpElapsed.current += delta;
      const time = jumpElapsed.current;
      yawRef.current =
        jumpFromYaw.current +
        jumpYawDelta.current * smoothstep(crouchProgress(time));
      const s = jumpProgress(time);
      pos.x = jumpFrom.current.x + (jumpTo.current.x - jumpFrom.current.x) * s;
      pos.z = jumpFrom.current.z + (jumpTo.current.z - jumpFrom.current.z) * s;
      pos.y = jumpArcY(jumpFrom.current.y, jumpTo.current.y, s);
      fwdRef.current.set(
        -Math.sin(yawRef.current),
        0,
        -Math.cos(yawRef.current),
      );
      if (time >= JUMP_END_TIME) jumping.current = false;
    } else if (
      !playerRef.current.animationLock &&
      !playerRef.current.movementLock
    ) {
      // ── Rotation ────────────────────────────────────────────────────────
      // Note: this group's own rotation is intentionally never set from yaw
      // — yawRef alone drives the camera and movement math, and AnimatedCat
      // (a child of this group) applies its own smoothed turn toward
      // yawRef.current independently, so the visible model eases into turns
      // instead of snapping.
      if (m.left) yawRef.current += TURN_SPEED * delta;
      if (m.right) yawRef.current -= TURN_SPEED * delta;

      // ── Forward direction ──────────────────────────────────────────────
      fwdRef.current.set(
        -Math.sin(yawRef.current),
        0,
        -Math.cos(yawRef.current),
      );

      // ── Movement ──────────────────────────────────────────────────────
      // While on the deck, a step is only taken if it lands inside the
      // footprint; if the full diagonal step doesn't, each axis is tried on
      // its own so walking into an edge at an angle slides along it instead
      // of stopping dead. Once off the deck (in the yard), movement is free
      // — except into the house's footprint, excluded the same way (same
      // per-axis slide-along-the-edge fallback) so the player can't walk
      // through its walls.
      const canStandAt = (x: number, z: number) =>
        (!onDeck.current || isInsideDeckFootprint(x, z)) &&
        !isInsideHouseFootprint(x, z);
      const tryMove = (dx: number, dz: number) => {
        const nx = pos.x + dx;
        const nz = pos.z + dz;
        if (canStandAt(nx, nz)) {
          pos.x = nx;
          pos.z = nz;
          return;
        }
        if (canStandAt(nx, pos.z)) {
          pos.x = nx;
          return;
        }
        if (canStandAt(pos.x, nz)) {
          pos.z = nz;
          return;
        }
      };
      if (m.forward)
        tryMove(
          fwdRef.current.x * SPEED * delta,
          fwdRef.current.z * SPEED * delta,
        );
      if (m.backward)
        tryMove(
          -fwdRef.current.x * SPEED * delta,
          -fwdRef.current.z * SPEED * delta,
        );
    }

    // ── Stair-camera pull-back progress ─────────────────────────────────────
    // Runs on its own timer independent of `scripted`. Stays 0 whenever it
    // hasn't been started or has already finished.
    if (cameraActive.current) {
      cameraElapsed.current += delta;
      const t = Math.min(1, cameraElapsed.current / STAIR_CAMERA_DURATION);
      stairCameraTRef.current = smoothstep(t);
      if (t >= 1) cameraActive.current = false;
    } else {
      stairCameraTRef.current = 0;
    }

    const isMoving =
      !scripted.current &&
      !jumping.current &&
      (m.forward || m.backward || m.left || m.right);
    // The scripted stair transition also counts as "moving" for animation
    // purposes (the cat should walk, not idle, while it's being carried down
    // the stairs) — kept separate from isMoving itself so useFollowCamera's
    // idle-drift timer/lookahead stay exactly as they were.
    movingRef.current = isMoving || scripted.current;

    // ── Stair-descent pose blend ─────────────────────────────────────────────
    // Eases toward 1 while actively descending (scripted transition, 'down'
    // direction only — ascending keeps the normal camera) and back to 0
    // otherwise. Exponential smoothing over STAIR_BLEND_TIME gives a smooth
    // ease in both directions with no snap at either end.
    const stairTarget =
      scripted.current && scriptDirection.current === 'down' ? 1 : 0;
    const stairK = 1 - Math.exp(-delta / STAIR_BLEND_TIME);
    stairBlendRef.current += (stairTarget - stairBlendRef.current) * stairK;

    playerRef.current.transitioning =
      scripted.current || jumping.current || playerRef.current.animationLock;
  });

  const reset = useCallback(() => {
    groupRef.current.position.copy(SPAWN_POS);
    yawRef.current = SPAWN_YAW;
    onDeck.current = true;
    scripted.current = false;
    jumping.current = false;
    stairBlendRef.current = 0;
    stairPitchRef.current = 0;
    cameraActive.current = false;
    cameraElapsed.current = 0;
  }, []);

  return {
    groupRef,
    yawRef,
    movingRef,
    stairBlendRef,
    fwdRef,
    stairCameraTRef,
    stairPitchRef,
    jumpingRef: jumping,
    reset,
  };
}
