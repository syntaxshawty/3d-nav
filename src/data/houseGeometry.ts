import { Shape, type Vector3Tuple } from 'three'
import { LEFT_X, TOTAL_WIDTH } from './deckGeometry'

// ── House blockout — a temporary, lightweight massing model for the rear of
// the suburban home the deck is attached to. Not final art: just enough
// primitive geometry (a box + a gable-roof prism) to give the yard a sense
// of place. Local axes match deckGeometry.ts: X = along the house wall,
// Z = away from the house. The deck occupies Z<=0; the house sits on the
// other side of the wall it's built against, so its front (deck-facing)
// wall is flush with Z=0 and it extends into Z>=0, away from the yard —
// the gable end at Z=0 is the only elevation ever actually seen.
//
// ── Tweakable dimensions ────────────────────────────────────────────────
export const HOUSE_WIDTH    = 30    // along the house wall (X) — a bit wider than the deck's TOTAL_WIDTH so the house reads as the larger structure the deck was built onto, not a wall exactly matching it
export const HOUSE_DEPTH    = 10    // front-to-back (Z), away from the deck — modest, since nothing past the gable end is ever visible
export const WALL_HEIGHT    = 10   // eave height — where the walls stop and the roof begins
export const ROOF_PITCH_DEG = 16    // roof slope in degrees above horizontal — raise for a steeper "cozier" roof, lower for a shallow "ranch" one
export const ROOF_OVERHANG  = 0.4   // how far the roof's edges extend past the wall faces they cover (front gable + both eaves)

// Centered on the deck's main bar (the section flush against the house),
// so the two structures always line up regardless of how either is resized.
const HOUSE_CENTER_X = LEFT_X + TOTAL_WIDTH / 2
export const HOUSE_POSITION: Vector3Tuple = [HOUSE_CENTER_X, 0, 0]

export const HOUSE_X_MIN = -HOUSE_WIDTH / 2
export const HOUSE_X_MAX = HOUSE_WIDTH / 2

// ── Roof ─────────────────────────────────────────────────────────────────
// A gable roof, built as a single triangular-prism mesh: the cross-section
// below (a triangle sitting on top of the wall) is extruded along Z, so the
// ridge runs front-to-back and the gable end — the triangle itself — faces
// the yard at Z=0. That end cap is what gives the blockout its instantly
// readable "house" silhouette from the deck.
const ROOF_PITCH = ROOF_PITCH_DEG * (Math.PI / 180)
const ROOF_HALF_SPAN = HOUSE_WIDTH / 2 + ROOF_OVERHANG
export const ROOF_RIDGE_RISE = ROOF_HALF_SPAN * Math.tan(ROOF_PITCH)

export const ROOF_SHAPE = new Shape()
ROOF_SHAPE.moveTo(-ROOF_HALF_SPAN, WALL_HEIGHT)
ROOF_SHAPE.lineTo(ROOF_HALF_SPAN, WALL_HEIGHT)
ROOF_SHAPE.lineTo(0, WALL_HEIGHT + ROOF_RIDGE_RISE)
ROOF_SHAPE.closePath()

// Extruded from Z=-ROOF_OVERHANG (so the gable end overhangs the front wall
// slightly, like a real eave) back to HOUSE_DEPTH+ROOF_OVERHANG at the rear.
export const ROOF_POSITION_Z = -ROOF_OVERHANG
export const ROOF_EXTRUDE_DEPTH = HOUSE_DEPTH + ROOF_OVERHANG * 2

// ── French doors ─────────────────────────────────────────────────────────
// Centered on the wall (X=0, local space) and flush against its front face
// (Z=0) — the door's own thin depth (~0.08) straddles that face, so it
// pokes slightly proud of the wall into the yard, the way a real door slab
// sits in its frame rather than being sunk into it.
export const FRENCH_DOOR_URL   = '/models/french_doors.glb'
export const FRENCH_DOOR_SCALE = 3   // raw model is ~2m wide x 1.34m tall x 0.08m thick — tweak to resize
// Raw model's own bottom edge (bboxMin.y from the source asset) is below its
// local origin — this lifts it so the bottom rests on the ground (Y=0)
// instead of straddling it.
const FRENCH_DOOR_BASE_OFFSET = 1
export const FRENCH_DOOR_POSITION: Vector3Tuple = [0, FRENCH_DOOR_BASE_OFFSET * FRENCH_DOOR_SCALE, 0]

// ── Footprint containment (exclusion) ───────────────────────────────────────
// The player has no physics collision (plain kinematic XZ movement — see
// usePlayerController.ts); isInsideDeckFootprint confines movement to the
// deck the same way. This is that same manual point-in-box test, just
// inverted: callers keep the player OUT of this box instead of inside it.
// Only the wall footprint is tested — the roof overhang sits well above
// head height, so it needs no collision of its own.
export function isInsideHouseFootprint(worldX: number, worldZ: number): boolean {
  const x = worldX - HOUSE_POSITION[0]
  const z = worldZ - HOUSE_POSITION[2]
  return x >= HOUSE_X_MIN && x <= HOUSE_X_MAX && z >= 0 && z <= HOUSE_DEPTH
}
