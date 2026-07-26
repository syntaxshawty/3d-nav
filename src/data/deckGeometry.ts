import { Shape, type Vector3Tuple } from 'three'

// ── Deck footprint constants — tweak these to reshape the deck ────────────────
// Local axes: X = along the house wall (centered on X=0), Z = away from the
// house (matches the player's default forward direction, so spawning at the
// house wall and facing -Z reads as "just stepped out the back door"),
// Y = up. The house wall sits at Z=0; DECK_POSITION offsets the whole thing.
//
// These are the deck's geometry facts — consumed both by environment/Deck.tsx
// (to render the slab/planks/stairs) and by gameplay code elsewhere (App.tsx's
// movement/footprint collision, AnimatedCat's stair pitch) — split out of the
// component so editing deck visuals doesn't force every gameplay consumer's
// file to reload, and so it's obvious which exports are "facts about the
// world" versus "how it's drawn."
export const DECK_POSITION: Vector3Tuple = [0, 0, 0]

export const DECK_HEIGHT    = 0.3                      // slab thickness
export const DECK_CLEARANCE = 0.6                      // open gap between the ground and the slab's underside
export const DECK_BOTTOM_Y  = DECK_CLEARANCE
export const DECK_CENTER_Y  = DECK_BOTTOM_Y + DECK_HEIGHT / 2
export const DECK_TOP_Y = DECK_BOTTOM_Y + DECK_HEIGHT   // walking-surface height, used for player spawn

// Main bar — the wide section directly against the house.
export const MAIN_DEPTH = 4      // away from the house (Z)
export const LEFT_X     = -4     // fixed left edge (X) that the house wall and left arm anchor to

// Arms — narrower legs running out from each end of the main bar, left open
// between them (that notch is where the flower bed will eventually sit).
// The two arms can reach different depths, so each gets its own far edge.
export const LEFT_ARM_DEPTH  = 6     // away from the house (Z), how far the left arm extends past the main bar
export const RIGHT_ARM_DEPTH = 8.5   // away from the house (Z), how far the right arm extends past the main bar
export const NOTCH_WIDTH     = 6     // along the house (X), the open gap between the two arms
export const LEFT_ARM_WIDTH  = 8     // along the house (X)
export const RIGHT_ARM_WIDTH = LEFT_ARM_WIDTH * 2   // rule: right arm is always twice the left arm's width

// Total span along the house — derived so the main bar always stays flush
// with both arms, however wide they're set.
export const TOTAL_WIDTH = LEFT_ARM_WIDTH + NOTCH_WIDTH + RIGHT_ARM_WIDTH
export const LEFT_FAR_Z  = -(MAIN_DEPTH + LEFT_ARM_DEPTH)    // outer (farthest-from-house) edge of the left arm
export const RIGHT_FAR_Z = -(MAIN_DEPTH + RIGHT_ARM_DEPTH)   // outer (farthest-from-house) edge of the right arm
export const RIGHT_X       = LEFT_X + TOTAL_WIDTH
export const RIGHT_ARM_X0  = RIGHT_X - RIGHT_ARM_WIDTH   // inner (notch-facing) edge of the right arm

// The right arm's inner-far corner — where its inner edge (facing the notch)
// meets its far edge (facing away from the house) — is chamfered off, and
// the stairs descend from that cut edge. So the arm is genuinely a pentagon,
// not a rectangle: the deck's own shape flows into the stairs instead of the
// stairs being a separate box bolted onto an untouched corner. STAIR_CHAMFER
// is how far the cut runs back along each of the two edges; the diagonal
// opening it leaves (the hypotenuse) is what the stairs' width is sized to.
export const STAIR_WIDTH_SCALE = 0.7   // shrinks the chamfer and stairs together, so they stay flush with each other
export const STAIR_CHAMFER     = (RIGHT_ARM_WIDTH / 4) * STAIR_WIDTH_SCALE
export const STAIR_TREAD_WIDTH = STAIR_CHAMFER * Math.SQRT2

// The right arm's footprint as a shape, so its structural slab can be
// extruded as a true pentagon instead of a box. Coordinates are (worldX,
// -worldZ) — negating Z here is what makes the extruded top face end up
// facing world +Y once the mesh is rotated flat (see environment/Deck.tsx) —
// and are wound so that top face's normal comes out pointing up rather than
// down (DeckBaseMaterial is double-sided too, as a belt-and-suspenders fix
// in case that winding is ever disturbed).
export const RIGHT_ARM_SHAPE = new Shape()
RIGHT_ARM_SHAPE.moveTo(RIGHT_ARM_X0, MAIN_DEPTH)                     // inner edge, near the house
RIGHT_ARM_SHAPE.lineTo(RIGHT_X, MAIN_DEPTH)                          // outer edge, near the house
RIGHT_ARM_SHAPE.lineTo(RIGHT_X, -RIGHT_FAR_Z)                        // outer edge, far corner
RIGHT_ARM_SHAPE.lineTo(RIGHT_ARM_X0 + STAIR_CHAMFER, -RIGHT_FAR_Z)   // far edge, chamfer start
RIGHT_ARM_SHAPE.lineTo(RIGHT_ARM_X0, -RIGHT_FAR_Z - STAIR_CHAMFER)   // inner edge, chamfer start
RIGHT_ARM_SHAPE.closePath()

// ── Plank detailing ─────────────────────────────────────────────────────────
export const PLANK_WIDTH     = 0.5
export const PLANK_GAP       = 0.05
export const PLANK_THICKNESS = 0.05   // how far the decorative plank layer's top surface sits above DECK_TOP_Y — anything standing "on the deck" should rest here, not at DECK_TOP_Y itself

// ── Stairs ──────────────────────────────────────────────────────────────
// Descend from the right arm's chamfered corner (see RIGHT_ARM_SHAPE /
// STAIR_CHAMFER above) at 45°, straight out from that cut edge. Visual
// only — no collider, and the player has no vertical movement yet, so
// these are architectural detail for now, not something the player can
// actually climb.
export const STEP_COUNT  = 4      // visible step blocks between the deck and the ground
export const STEP_RUN    = 0.55   // depth, along the descent direction, of each tread
export const STEP_RISER  = DECK_TOP_Y / (STEP_COUNT + 1)   // evenly divides the full deck height, including the final unmarked step down to the ground

// Anchored to the midpoint of the chamfered edge, so the stairs sit
// centered in the opening they descend from.
export const STAIR_CORNER_X = RIGHT_ARM_X0 + STAIR_CHAMFER / 2
export const STAIR_CORNER_Z = RIGHT_FAR_Z + STAIR_CHAMFER / 2

// Descend at 45°, away from the deck (away from the notch *and* away from
// the house) — perpendicular to the chamfered edge — rotation.y that maps
// local +Z (each step's run/depth axis) to that direction:
// local (0,0,1) -> world (sin angle, 0, cos angle).
export const STAIR_ANGLE = Math.atan2(-1, -1)   // -135°
export const STAIR_DIR_X = Math.sin(STAIR_ANGLE)
export const STAIR_DIR_Z = Math.cos(STAIR_ANGLE)

// World-space spot to spawn the player: just off the house wall, centered on
// the main bar, standing on the deck's walking surface, facing -Z (yaw 0 —
// the player's existing default) which points away from the house into the yard.
export const DECK_SPAWN_POSITION: Vector3Tuple = [
  DECK_POSITION[0] + LEFT_X + TOTAL_WIDTH / 2,
  DECK_POSITION[1] + DECK_TOP_Y,
  DECK_POSITION[2] - 0.5,
]
export const DECK_SPAWN_YAW = 0

// ── Footprint containment ───────────────────────────────────────────────────
// The player has no physics collision (plain kinematic XZ movement — see
// App.tsx), so staying on the deck is enforced here instead: a manual
// point-in-shape test against the same three pieces the deck is built from
// (main bar, left arm, right arm minus its chamfered corner). The stairs
// aren't a gap in this footprint — they're just another edge of the right
// arm's shape (the chamfered one) — the player can't wander onto the visible
// steps; they cross it only via the scripted stair transition below.
export function isInsideDeckFootprint(x: number, z: number): boolean {
  const inMainBar = x >= LEFT_X && x <= LEFT_X + TOTAL_WIDTH && z >= -MAIN_DEPTH && z <= 0
  const inLeftArm = x >= LEFT_X && x <= LEFT_X + LEFT_ARM_WIDTH && z >= LEFT_FAR_Z && z <= -MAIN_DEPTH

  const inRightArmRect = x >= RIGHT_ARM_X0 && x <= RIGHT_X && z >= RIGHT_FAR_Z && z <= -MAIN_DEPTH
  const dx = x - RIGHT_ARM_X0
  const dz = z - RIGHT_FAR_Z
  const inRightArm = inRightArmRect && dx + dz >= STAIR_CHAMFER   // outside the cut corner's triangle

  return inMainBar || inLeftArm || inRightArm
}

// ── Stair transition anchors ────────────────────────────────────────────────
// Where the scripted "walk down/up the stairs" transition (App.tsx) starts
// and ends. Both are pulled STAIR_LANDING_MARGIN back from the stairs
// themselves (top: onto the deck; base: past the last tread) so the
// character's own footprint fully clears the stair geometry at rest instead
// of ending with its back paws still inside a tread or hanging off the deck
// edge.
const STAIR_LANDING_MARGIN = 0.6

export const STAIR_TOP_POSITION: Vector3Tuple = [
  STAIR_CORNER_X - STAIR_DIR_X * STAIR_LANDING_MARGIN,
  DECK_TOP_Y,
  STAIR_CORNER_Z - STAIR_DIR_Z * STAIR_LANDING_MARGIN,
]

const STAIR_DESCENT_RUN = STEP_COUNT * STEP_RUN + STEP_RUN * 0.5   // clears the last riser — the stairs' own horizontal run, before the landing margin
const STAIR_RUN_TOTAL   = STAIR_DESCENT_RUN + STAIR_LANDING_MARGIN
export const STAIR_BASE_POSITION: Vector3Tuple = [
  STAIR_CORNER_X + STAIR_DIR_X * STAIR_RUN_TOTAL,
  0,
  STAIR_CORNER_Z + STAIR_DIR_Z * STAIR_RUN_TOTAL,
]

// Facing angles for the transition, so the avatar visibly faces down/up the
// stairs while it plays rather than sidestepping. Same yaw convention as the
// player controller: forward = (-sin(yaw), 0, -cos(yaw)).
export const STAIR_DESCEND_YAW = STAIR_ANGLE + Math.PI   // away from the deck, down the stairs
export const STAIR_ASCEND_YAW  = STAIR_ANGLE             // back toward the deck, up the stairs

// How steep the stairs' descent is, in radians below horizontal — computed
// from the real rise (DECK_TOP_Y, since the base sits at ground level 0)
// over the stairs' own horizontal run (STAIR_DESCENT_RUN — deliberately not
// STAIR_RUN_TOTAL, which also includes the flat landing margin and would
// dilute the angle), not a guessed angle, so anything that visually leans
// into the slope (e.g. the player model) matches the actual stair geometry.
export const STAIR_SLOPE_PITCH = Math.atan2(DECK_TOP_Y, STAIR_DESCENT_RUN)
