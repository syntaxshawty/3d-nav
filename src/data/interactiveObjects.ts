import { DECK_TOP_Y, STAIR_TOP_POSITION, STAIR_BASE_POSITION } from './deckGeometry'

// Central content file for the garden.
// To add a new object: add an entry to the array below, refresh — done.
// No scene component code needs to change.

export interface InteractiveObjectData {
  id:                string
  title:             string
  description:       string
  position:          [number, number, number]
  interactionRadius: number      // player must be within this many units to trigger a prompt
  prompt:            string      // text shown in the proximity prompt
  href?:             string      // optional internal route for a full page
  linkLabel?:        string      // button label for href (defaults to "Read more")
  viewerModel?:      string      // GLB path — if set, the overlay shows a spinnable 3D preview of this model
  // If set, E plays this scripted movement instead of opening the info
  // overlay — see the stair-transition handling in App.tsx. title/description
  // are unused for these (the overlay never opens) but stay required so every
  // entry still reads as a real object at a glance.
  action?:           'descend-stairs' | 'ascend-stairs'
  visual: {
    kind:   string               // determines which geometry to render: 'none' | 'flower' | 'bench' | ...
    color?: string               // primary color passed to the visual
  }
}

// Shared with Backyard.tsx so the real strawberry-pot model (rendered there)
// and this proximity/interaction entry always agree on where the pot is.
export const STRAWBERRY_POT_POSITION: [number, number, number] = [20, DECK_TOP_Y, -10]

export const interactiveObjects: InteractiveObjectData[] = [
  {
    id:                'strawberry-pot',
    title:             'Strawberry Pot',
    description:       'A tiered planter, thick with strawberry plants.',
    position:          STRAWBERRY_POT_POSITION,
    interactionRadius: 2.5,
    prompt:            'Press E to inspect',
    viewerModel:       '/models/strawberry.glb',
    // 'none': the pot itself is already rendered by Backyard.tsx (as the real
    // GLB prop) — this entry only adds proximity detection and the popup.
    visual:            { kind: 'none' },
  },
  {
    id:                'stair-top',
    title:             'Deck Stairs',
    description:       '',
    position:          STAIR_TOP_POSITION,
    interactionRadius: 1.8,
    prompt:            'Press E to go down to the yard',
    action:            'descend-stairs',
    // The stairs themselves are already rendered by Deck.tsx.
    visual:            { kind: 'none' },
  },
  {
    id:                'stair-bottom',
    title:             'Deck Stairs',
    description:       '',
    position:          STAIR_BASE_POSITION,
    interactionRadius: 1.8,
    prompt:            'Press E to go up to the deck',
    action:            'ascend-stairs',
    visual:            { kind: 'none' },
  },
]
