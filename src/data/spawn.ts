import { Vector3 } from 'three'
import { DECK_SPAWN_POSITION, DECK_SPAWN_YAW } from './deckGeometry'

// ── Camera rig — how closely the camera hugs and tracks the player ─────────
// Shared between the live per-frame camera-follow math (Scene.tsx) and the
// spawn/reset camera pose computed below, so they can't drift out of sync.
export const CAMERA_DISTANCE      = 2.2   // how far behind the player the camera sits
export const CAMERA_HEIGHT        = 0.95  // camera height above the ground/player's feet
export const CAMERA_TARGET_OFFSET = 1.3   // look-at height above the player's feet — aimed above the avatar's head so the avatar itself sits centered in the bottom third of frame

// Starting position and yaw — used for both initial placement and reset.
// The player spawns standing on the deck, facing away from the house.
export const SPAWN_POS = new Vector3(...DECK_SPAWN_POSITION)
export const SPAWN_YAW = DECK_SPAWN_YAW

// Camera position/look-target that match SPAWN_POS/SPAWN_YAW under the same
// formulas useFrame uses every frame — computed once so the initial Canvas
// camera and the reset button can't drift out of sync with the spawn point.
export const SPAWN_CAM_POS = new Vector3(
  SPAWN_POS.x + Math.sin(SPAWN_YAW) * CAMERA_DISTANCE,
  SPAWN_POS.y + CAMERA_HEIGHT,
  SPAWN_POS.z + Math.cos(SPAWN_YAW) * CAMERA_DISTANCE,
)
export const SPAWN_LOOK_TARGET = new Vector3(
  SPAWN_POS.x,
  SPAWN_POS.y + CAMERA_TARGET_OFFSET,
  SPAWN_POS.z,
)
