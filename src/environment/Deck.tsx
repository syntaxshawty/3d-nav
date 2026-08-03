import { DoubleSide } from 'three'
import { RigidBody } from '@react-three/rapier'
import {
  DECK_POSITION, DECK_HEIGHT, DECK_CENTER_Y, DECK_BOTTOM_Y, DECK_TOP_Y,
  MAIN_DEPTH, LEFT_X, LEFT_ARM_DEPTH, LEFT_ARM_WIDTH,
  TOTAL_WIDTH, LEFT_FAR_Z, RIGHT_FAR_Z, RIGHT_X, RIGHT_ARM_X0,
  STAIR_CHAMFER, STAIR_TREAD_WIDTH, RIGHT_ARM_SHAPE,
  PLANK_WIDTH, PLANK_GAP, PLANK_THICKNESS,
  STEP_COUNT, STEP_RUN, STEP_RISER, STAIR_CORNER_X, STAIR_CORNER_Z,
  STAIR_ANGLE, STAIR_DIR_X, STAIR_DIR_Z,
} from '../data/deckGeometry'

// Structural slab color — a shadowed base tone that only peeks through the
// gaps between planks, giving the plank layer above it visible seams.
function DeckBaseMaterial() {
  return <meshStandardMaterial color="#4a2f18" roughness={0.9} side={DoubleSide} />
}

export function Deck() {
  return (
    <group position={DECK_POSITION}>
      <RigidBody type="fixed" colliders="hull">
        {/* Main bar, flush against the house */}
        <mesh position={[LEFT_X + TOTAL_WIDTH / 2, DECK_CENTER_Y, -MAIN_DEPTH / 2]} receiveShadow>
          <boxGeometry args={[TOTAL_WIDTH, DECK_HEIGHT, MAIN_DEPTH]} />
          <DeckBaseMaterial />
        </mesh>

        {/* Left arm */}
        <mesh position={[LEFT_X + LEFT_ARM_WIDTH / 2, DECK_CENTER_Y, -(MAIN_DEPTH + LEFT_ARM_DEPTH / 2)]}>
          <boxGeometry args={[LEFT_ARM_WIDTH, DECK_HEIGHT, LEFT_ARM_DEPTH]} />
          <DeckBaseMaterial />
        </mesh>

        {/* Right arm — twice as wide as the left, reaches further out too, and
            has its inner-far corner chamfered off (see RIGHT_ARM_SHAPE) where
            the stairs descend. colliders="hull" (rather than "cuboid") so this
            one's collider is a true convex hull of the pentagon rather than
            just its rectangular bounding box — harmless for the other two
            boxes, whose hull is identical to their own shape anyway. */}
        <mesh position={[0, DECK_BOTTOM_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <extrudeGeometry args={[RIGHT_ARM_SHAPE, { depth: DECK_HEIGHT, bevelEnabled: false }]} />
          <DeckBaseMaterial />
        </mesh>
      </RigidBody>

      {/* Decorative only — no colliders of their own. The footprint above already covers movement. */}
      <PlankSection x0={LEFT_X} x1={LEFT_X + TOTAL_WIDTH} z0={-MAIN_DEPTH} z1={0} />
      <PlankSection x0={LEFT_X} x1={LEFT_X + LEFT_ARM_WIDTH} z0={LEFT_FAR_Z} z1={-MAIN_DEPTH} />
      <PlankSection
        x0={RIGHT_ARM_X0} x1={RIGHT_X} z0={RIGHT_FAR_Z} z1={-MAIN_DEPTH}
        chamfer={{ cutX0: RIGHT_ARM_X0, cutSize: STAIR_CHAMFER }}
      />

      <Stairs />
    </group>
  )
}

// ── Plank detailing ─────────────────────────────────────────────────────────
// Thin boards running the "away from house" direction, with small gaps that
// let the darker slab underneath show through as seams — real geometry, not
// a texture, so it holds up at the close, low camera angles now in use.
const PLANK_COLORS = ['#8b5a2b', '#7a4d24']

function PlankSection({
  x0, x1, z0, z1, chamfer,
}: {
  x0: number; x1: number; z0: number; z1: number
  // Trims planks whose near-house-facing... rather, whose near-corner (at
  // x=cutX0, z=z0) is chamfered off, so the plank layer follows the same
  // diagonal cut as the structural slab beneath it instead of leaving a
  // rectangular gap. Each affected plank is individually shortened to just
  // clear the diagonal at its own inner edge — a stepped approximation of
  // the cut, the same way the stair treads themselves approximate a ramp.
  chamfer?: { cutX0: number; cutSize: number }
}) {
  const width = x1 - x0
  const count = Math.max(1, Math.round(width / (PLANK_WIDTH + PLANK_GAP)))
  const pitch = width / count
  const plankWidth = pitch - PLANK_GAP

  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const centerX = x0 + pitch * (i + 0.5)
        let plankZ0 = z0
        if (chamfer) {
          const minX = centerX - plankWidth / 2
          const lineZ = z0 + chamfer.cutSize - (minX - chamfer.cutX0)
          plankZ0 = Math.min(z0 + chamfer.cutSize, Math.max(z0, lineZ))
        }
        const depth = z1 - plankZ0
        return (
          <mesh
            key={i}
            position={[centerX, DECK_TOP_Y + PLANK_THICKNESS / 2, plankZ0 + depth / 2]}
            receiveShadow
          >
            <boxGeometry args={[plankWidth, PLANK_THICKNESS, depth]} />
            <meshStandardMaterial color={PLANK_COLORS[i % PLANK_COLORS.length]} roughness={0.85} />
          </mesh>
        )
      })}
    </>
  )
}

// ── Stairs ──────────────────────────────────────────────────────────────
// Descend from the right arm's chamfered corner at 45°, straight out from
// that cut edge. Visual only — no collider, and the player has no vertical
// movement yet, so these are architectural detail for now, not something
// the player can actually climb.
const STAIR_COLOR = '#8b5a2b'

function Stairs() {
  return (
    <>
      {Array.from({ length: STEP_COUNT }, (_, i) => {
        const topY = DECK_TOP_Y - STEP_RISER * (i + 1)
        const u = (i + 0.5) * STEP_RUN   // distance from the chamfered edge, along the descent direction, to this step's center
        return (
          <mesh
            key={i}
            position={[STAIR_CORNER_X + STAIR_DIR_X * u, topY / 2, STAIR_CORNER_Z + STAIR_DIR_Z * u]}
            rotation={[0, STAIR_ANGLE, 0]}
          >
            <boxGeometry args={[STAIR_TREAD_WIDTH, topY, STEP_RUN]} />
            <meshStandardMaterial color={STAIR_COLOR} roughness={0.85} />
          </mesh>
        )
      })}
    </>
  )
}
