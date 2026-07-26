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

  { id: 'yard-tree', url: '/models/yard_tree.glb', position: [10, 0, -25], scale: 0.5 },
  { id: 'cat-statue', url: '/models/cat.glb', position: [7.5, 0, -22.5], rotation: [0, 0.6, 0], scale: 1 },

  { id: 'blackberry-01-1', url: '/models/blackberry_01.glb', position: [35, 0, -35], scale: 5 },
  { id: 'blackberry-02-1', url: '/models/blackberry_02.glb', position: [35, 1, -27], scale: 7 },
  { id: 'blackberry-03-1', url: '/models/blackberry_03.glb', position: [28, 0, -27], scale: 6 },
  { id: 'blackberry-02-2', url: '/models/blackberry_02.glb', position: [36, 0, -28], scale: 7 },
  { id: 'blackberry-03-2', url: '/models/blackberry_03.glb', position: [25, 0, -27], scale: 7 },
  { id: 'blackberry-01-2', url: '/models/blackberry_01.glb', position: [37, 0, -28], scale: 6 },

  { id: 'deck-chair', url: '/models/deck_chair.glb', position: [20, DECK_TOP_Y, -6], rotation: [0, 180, 0], scale: 2.175 },
  // Shared with interactiveObjects.ts so the real model here and the
  // proximity/interaction entry there always agree on where the pot is.
  { id: 'strawberry-pot', url: '/models/strawberry_pot.glb', position: STRAWBERRY_POT_POSITION, scale: 1 },
]
