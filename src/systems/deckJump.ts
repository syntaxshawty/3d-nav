import {
  DECK_TOP_Y,
  JUMP_EDGE_RADIUS,
  nearestJumpEdge,
} from '../data/deckGeometry';
import { isInsideHouseFootprint } from '../data/houseGeometry';
import { CAMERA_DISTANCE } from '../data/spawn';

// ── Jumping from the deck's edge down to the yard ───────────────────────────
// The jump is the JumpFw_IP clip — played in place — carried along an arc
// by usePlayerController. The arc is keyed to the clip's own timing so the
// cat leaves the deck as its back legs push off and reaches the ground as
// its front paws touch down (both read from the clip's skeleton). The clip
// still dips the paws below the cat's origin at push-off and on landing;
// AnimatedCat's paw lift raises the body over those moments so the paws
// meet the deck/ground instead of sinking into it.
export const JUMP_CLIP = 'JumpFw_IP';
const TAKEOFF_TIME = 0.29; // seconds into the clip — back legs push off
const LANDING_TIME = 1.33; // front paws touch down
export const JUMP_END_TIME = 1.7; // settled back to standing — control returns

const ARC_HEIGHT = 0.4; // extra height at the middle of the arc, over a straight drop
// How far out from the edge the cat lands. The follow camera sits
// CAMERA_DISTANCE behind the cat at about deck height, so landing any closer
// leaves it inside the deck — this clears the edge by CAMERA_EDGE_CLEARANCE.
const CAMERA_EDGE_CLEARANCE = 0.4;
const LANDING_DISTANCE = CAMERA_DISTANCE + CAMERA_EDGE_CLEARANCE;

// The prompt only shows near an edge (JUMP_EDGE_RADIUS) the player is
// actually facing.
const FACING_MIN = 0.5; // cos of the widest angle between facing and the edge's outward normal (60°)

export interface JumpPlan {
  edgeDist: number; // how far the player is from the edge they'd jump off
  toX: number;
  toZ: number;
  yaw: number; // facing straight out from the edge
}

// Where a jump from (x, z), facing (fwdX, fwdZ), would go — or null if the
// player isn't on the deck close to a yard-facing edge and facing it, or the
// landing spot is inside the house.
export function planJump(
  x: number,
  y: number,
  z: number,
  fwdX: number,
  fwdZ: number,
): JumpPlan | null {
  if (y < DECK_TOP_Y - 0.01) return null;
  const edge = nearestJumpEdge(x, z);
  if (!edge || edge.dist > JUMP_EDGE_RADIUS) return null;
  if (fwdX * edge.nx + fwdZ * edge.nz < FACING_MIN) return null;
  const toX = edge.x + edge.nx * LANDING_DISTANCE;
  const toZ = edge.z + edge.nz * LANDING_DISTANCE;
  if (isInsideHouseFootprint(toX, toZ)) return null;
  return { edgeDist: edge.dist, toX, toZ, yaw: Math.atan2(-edge.nx, -edge.nz) };
}

// 0→1 progress through the airborne part of the jump at `time` seconds in.
export function jumpProgress(time: number) {
  return Math.min(
    1,
    Math.max(0, (time - TAKEOFF_TIME) / (LANDING_TIME - TAKEOFF_TIME)),
  );
}

// 0→1 progress through the crouch before takeoff — used to turn the cat to
// face straight out from the edge before it leaves the deck.
export function crouchProgress(time: number) {
  return Math.min(1, time / TAKEOFF_TIME);
}

// Height along the arc at airborne progress s, from the deck down to the yard.
export function jumpArcY(fromY: number, toY: number, s: number) {
  return fromY + (toY - fromY) * s + 4 * ARC_HEIGHT * s * (1 - s);
}
