import { DECK_TOP_Y } from './deckGeometry'
import { STRAWBERRY_POT_POSITION } from './interactiveObjects'

export interface PlantData {
  id:       string
  url:      string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?:   number | [number, number, number]
}

// ── Layout ───────────────────────────────────────────────────────────────
export const plants: PlantData[] = [
  { id: 'plum-tree', url: '/models/plum_tree.glb', position: [-6, 0, -15], scale: 1 },
  
  { id: 'garden-shed', url: '/models/garden_shed.glb', position: [-4.5, 0, -22.5], rotation: [0, Math.PI / 2, 0], scale: 1.5 },

  { id: 'yard-tree', url: '/models/yard_tree.glb', position: [10, 0, -26], scale: .85 },

  { id: 'lemon-tree', url: '/models/lemon_tree.glb', position: [5, 0, -7], rotation: [0, Math.PI / 2, 0], scale: 0.75 },

  { id: 'bougainvillea', url: '/models/bougainvillea.glb', position: [29.5, 0, -7], rotation: [0, Math.PI / 2, 0], scale: 1.5 },

  { id: 'blackberry-01-1', url: '/models/blackberry_01.glb', position: [35, 0, -35], scale: 5 },
  { id: 'blackberry-02-1', url: '/models/blackberry_02.glb', position: [35, 1, -27], scale: 7 },
  { id: 'blackberry-03-1', url: '/models/blackberry_03.glb', position: [28, 0, -27], scale: 6 },
  { id: 'blackberry-02-2', url: '/models/blackberry_02.glb', position: [36, 0, -28], scale: 7 },
  { id: 'blackberry-03-2', url: '/models/blackberry_03.glb', position: [25, 0, -27], scale: 7 },
  { id: 'blackberry-01-2', url: '/models/blackberry_01.glb', position: [37, 0, -28], scale: 6 },
  { id: 'blackberry-01-3', url: '/models/blackberry_01.glb', position: [45, 1, -24], scale: 6 },
  
  { id: 'planter-box-0', url: '/models/planter_box_single.glb', position: [-2.5, 0, -27], scale: 0.01 },
  { id: 'planter-box-1', url: '/models/planter_box_single.glb', position: [2,    0, -27], scale: 0.01 },
  { id: 'planter-box-2', url: '/models/planter_box_single.glb', position: [6.5,  0, -27], scale: 0.01 },
  { id: 'planter-box-3', url: '/models/planter_box_single.glb', position: [11,   0, -27], scale: 0.01 },
  { id: 'planter-box-4', url: '/models/planter_box_single.glb', position: [15.5, 0, -27], scale: 0.01 },
  { id: 'planter-box-5', url: '/models/planter_box_single.glb', position: [20,   0, -27], scale: 0.01 },

  { id: 'nasturtium-0', url: '/models/nasturtium.glb', position: [-2.5, 1, -27], scale: 0.05 },
  { id: 'nasturtium-1', url: '/models/nasturtium.glb', position: [2,    1, -27], scale: 0.05 },
  { id: 'nasturtium-2', url: '/models/nasturtium.glb', position: [6.5,  1, -27], scale: 0.05 },
  { id: 'nasturtium-3', url: '/models/nasturtium.glb', position: [-2,   0.8, -27], scale: 0.05 },
  { id: 'nasturtium-4', url: '/models/nasturtium.glb', position: [1.5, 0.8, -27], scale: 0.05 },
  { id: 'nasturtium-5', url: '/models/nasturtium.glb', position: [5,   0.8, -27], scale: 0.05 },

  { id: 'brick-bed', url: '/models/brick_bed.glb', position: [26, 0, -20], rotation: [0, Math.PI * 1.5 , 0], scale: 0.4 },

  { id: 'deck-chair', url: '/models/deck_chair.glb', position: [20, DECK_TOP_Y, -6], rotation: [0, 180, 0], scale: 2.8 },
  
  { id: 'strawberry-pot', url: '/models/strawberry_pot.glb', position: STRAWBERRY_POT_POSITION, scale: 1.75 },
]
