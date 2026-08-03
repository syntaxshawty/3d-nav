import { DoubleSide } from 'three'
import { GltfProp } from '../components/GltfProp'
import {
  HOUSE_POSITION, HOUSE_WIDTH, HOUSE_DEPTH, WALL_HEIGHT,
  ROOF_SHAPE, ROOF_POSITION_Z, ROOF_EXTRUDE_DEPTH,
  FRENCH_DOOR_URL, FRENCH_DOOR_POSITION, FRENCH_DOOR_SCALE,
} from '../data/houseGeometry'

// Soft, desaturated blue for all wall surfaces — a single flat massing
// color, since this is a temporary blockout, not final art.
const WALL_COLOR = '#8CA0B3'
// Neutral, warm-gray roof — contrasts against the walls without competing
// with them.
const ROOF_COLOR = '#4B4844'

// Temporary blockout for the rear of the house the deck attaches to: a box
// for the walls plus a simple gable roof, both in flat primitive geometry.
// No windows, doors, trim, or interior — just enough massing to give the
// yard a sense of place and orientation. See houseGeometry.ts for the
// dimensions and how the two pieces line up.
export function House() {
  return (
    <group position={HOUSE_POSITION}>
      <mesh position={[0, WALL_HEIGHT / 2, HOUSE_DEPTH / 2]} castShadow receiveShadow>
        <boxGeometry args={[HOUSE_WIDTH, WALL_HEIGHT, HOUSE_DEPTH]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.85} />
      </mesh>
      <GableRoof />
      <GltfProp url={FRENCH_DOOR_URL} position={FRENCH_DOOR_POSITION} scale={FRENCH_DOOR_SCALE} />
    </group>
  )
}

// A single triangular-prism mesh — see ROOF_SHAPE in houseGeometry.ts for
// why extruding it produces a gable end facing the yard for free. Double-
// sided as a belt-and-suspenders fix for the extrude cap's winding, same
// reasoning as DeckBaseMaterial in Deck.tsx.
function GableRoof() {
  return (
    <mesh position={[0, 0, ROOF_POSITION_Z]} castShadow receiveShadow>
      <extrudeGeometry args={[ROOF_SHAPE, { depth: ROOF_EXTRUDE_DEPTH, bevelEnabled: false }]} />
      <meshStandardMaterial color={ROOF_COLOR} roughness={0.75} side={DoubleSide} />
    </mesh>
  )
}
