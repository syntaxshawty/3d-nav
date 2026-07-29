import { DECK_TOP_Y } from './deckGeometry'
import { STRAWBERRY_POT_POSITION } from './interactiveObjects'

// Central content file for the yard's decorative GLB props (trees, brambles,
// deck furniture). To add a new one: add an entry to the array below,
// refresh — done. Mirrors interactiveObjects.ts's data-driven pattern.
export interface PlantData {
  id:       string
  url:      string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?:   number | [number, number, number]
}

// ── Layout ───────────────────────────────────────────────────────────────
// Positions loosely follow the sketch's relative placement within the yard
// rectangle: plum tree along the left fence, the unlabeled canopy tree and
// cat near the back-middle, blackberry brambles in the back-right corner,
// and the deck-top props (deck chair, strawberry pot) placed beside the
// existing deck.
export const plants: PlantData[] = [
  { id: 'plum-tree', url: '/models/plum_tree.glb', position: [-6, 0, -15], scale: 0.77 },
  // Tucked into the yard's back-left corner (fence runs along X=-8 and
  // Z=-28) — inset from both fence lines by roughly the shed's own half-width
  // so its footprint (~3x3 units, pivot recentered to base-center during
  // optimize) clears the pickets instead of poking through them.
  { id: 'garden-shed', url: '/models/garden_shed.glb', position: [-4.5, 0, -22.5], rotation: [0, Math.PI / 2, 0], scale: 1.5 },

  { id: 'yard-tree', url: '/models/yard_tree.glb', position: [10, 0, -26], scale: 1 },

  { id: 'blackberry-01-1', url: '/models/blackberry_01.glb', position: [35, 0, -35], scale: 5 },
  { id: 'blackberry-02-1', url: '/models/blackberry_02.glb', position: [35, 1, -27], scale: 7 },
  { id: 'blackberry-03-1', url: '/models/blackberry_03.glb', position: [28, 0, -27], scale: 6 },
  { id: 'blackberry-02-2', url: '/models/blackberry_02.glb', position: [36, 0, -28], scale: 7 },
  { id: 'blackberry-03-2', url: '/models/blackberry_03.glb', position: [25, 0, -27], scale: 7 },
  { id: 'blackberry-01-2', url: '/models/blackberry_01.glb', position: [37, 0, -28], scale: 6 },
  { id: 'blackberry-01-3', url: '/models/blackberry_01.glb', position: [45, 1, -24], scale: 6 },
  // Single planter-box unit (source asset is authored in centimeters, not
  // meters — scale 0.01 converts to real-world size: ~4.5 wide x 2.5 deep x
  // 1.5 tall) repeated edge-to-edge along the rear fence (Z=-28), spaced by
  // its own real width so the run reads as continuous. Its long axis is
  // already native X, matching the fence's direction, so no rotation is
  // needed. Spans roughly X=0 to X=18 — clear of the shed on one side and
  // the blackberry brambles (X=25+) on the other.
  { id: 'planter-box-0', url: '/models/planter_box_single.glb', position: [-2.5, 0, -27], scale: 0.01 },
  { id: 'planter-box-1', url: '/models/planter_box_single.glb', position: [2,    0, -27], scale: 0.01 },
  { id: 'planter-box-2', url: '/models/planter_box_single.glb', position: [6.5,  0, -27], scale: 0.01 },
  { id: 'planter-box-3', url: '/models/planter_box_single.glb', position: [11,   0, -27], scale: 0.01 },
  { id: 'planter-box-4', url: '/models/planter_box_single.glb', position: [15.5, 0, -27], scale: 0.01 },
  { id: 'planter-box-5', url: '/models/planter_box_single.glb', position: [20,   0, -27], scale: 0.01 },

  // Nasturtium clumps sitting atop the three planters between the shed
  // (X=-4.5) and the tree (X=10) — planter-box-0/1/2. Y is the planter's own
  // real-world height (native 153.7 x scale 0.01) so the flowers rest on its
  // rim rather than at ground level. Source asset is also authored in
  // centimeters — same 0.01 conversion as the planter box.
  { id: 'nasturtium-0', url: '/models/nasturtium.glb', position: [-2.5, 1, -27], scale: 0.05 },
  { id: 'nasturtium-1', url: '/models/nasturtium.glb', position: [2,    1, -27], scale: 0.05 },
  { id: 'nasturtium-2', url: '/models/nasturtium.glb', position: [6.5,  1, -27], scale: 0.05 },
  { id: 'nasturtium-3', url: '/models/nasturtium.glb', position: [-2,   0.8, -27], scale: 0.05 },
  { id: 'nasturtium-4', url: '/models/nasturtium.glb', position: [1.5, 0.8, -27], scale: 0.05 },
  { id: 'nasturtium-5', url: '/models/nasturtium.glb', position: [5,   0.8, -27], scale: 0.05 },

  // Source asset was a huge photogrammetry-scale scan (245MB raw, 16k-square
  // textures, 8.1M vertices) — heavily downsampled during optimize, and
  // still large at real-world scale (~35.7 wide x 21.3 deep x 5.9 tall
  // native), so scale 0.25 brings it down to a corner-accent size (~9 x 5.3
  // x 1.5). Rotated 90° so its long native-X axis runs along world Z,
  // matching the right fence's direction (X=30, from Z=-28 to Z=0). Kept
  // slightly forward of the very back corner to avoid fully overlapping the
  // blackberry cluster already anchored there.
  { id: 'brick-bed', url: '/models/brick_bed.glb', position: [26, 0, -20], rotation: [0, Math.PI * 1.5 , 0], scale: 0.4 },

  { id: 'deck-chair', url: '/models/deck_chair.glb', position: [20, DECK_TOP_Y, -6], rotation: [0, 180, 0], scale: 2.8 },
  // Shared with interactiveObjects.ts so the real model here and the
  // proximity/interaction entry there always agree on where the pot is.
  { id: 'strawberry-pot', url: '/models/strawberry_pot.glb', position: STRAWBERRY_POT_POSITION, scale: 1.75 },
]
