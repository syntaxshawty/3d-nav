import type { Vector3Tuple } from 'three';
import {
  DECK_TOP_Y,
  STAIR_TOP_POSITION,
  STAIR_BASE_POSITION,
} from './deckGeometry';
import { HOUSE_POSITION } from './houseGeometry';

// Central content file for the garden.
// To add a new object: add an entry to the array below, refresh — done.
// No scene component code needs to change.

// Reused for every position export in this file (and by callers like
// plants.ts that share one) so a single type describes "a point in world
// space" everywhere, instead of each file redeclaring its own
// [number, number, number] tuple.
export type Position = Vector3Tuple;

export interface InteractiveObjectData {
  id: string;
  title: string;
  description: string;
  position: Position;
  interactionRadius: number; // player must be within this many units to trigger a prompt
  prompt: string; // text shown in the proximity prompt
  href?: string; // optional internal route for a full page
  linkLabel?: string; // button label for href (defaults to "Read more")
  viewerModel?: string; // GLB path — if set, the overlay shows a spinnable 3D preview of this model
  // If set, E plays this scripted movement instead of opening the info
  // overlay — see the stair-transition handling in App.tsx. title/description
  // are unused for these (the overlay never opens) but stay required so every
  // entry still reads as a real object at a glance.
  action?: 'descend-stairs' | 'ascend-stairs';
  visual: {
    kind: string; // determines which geometry to render: 'none' | 'flower' | 'bench' | 'image' | ...
    color?: string; // primary color passed to the visual
    image?: string; // texture path — required when kind === 'image'; rendered as a camera-facing photo instead of geometry (e.g. for something that's no longer actually there)
    imageScale?: number; // width in world units of the image billboard (defaults to 1.5)
  };
}

// Shared with Backyard.tsx so the real strawberry-pot model (rendered there)
// and this proximity/interaction entry always agree on where the pot is.
export const STRAWBERRY_POT_POSITION: Position = [20, DECK_TOP_Y, -10];

// Shared with plants.ts so the real lemon-tree model (rendered there) and
// this proximity/interaction entry always agree on where the tree is —
// same pattern as STRAWBERRY_POT_POSITION above.
export const LEMON_TREE_POSITION: Position = [5, 0, -7];

// Same sharing pattern as LEMON_TREE_POSITION — one constant per real GLB
// prop in plants.ts, imported by both files so the visual and the
// interaction trigger can't drift apart.
export const PLUM_TREE_POSITION: Position = [-6, 0, -15];
export const GARDEN_SHED_POSITION: Position = [-4.5, 0, -22.5];
export const YARD_TREE_POSITION: Position = [10, 0, -26];
export const BOUGAINVILLEA_POSITION: Position = [29.5, 0, -7];
export const DECK_CHAIR_POSITION: Position = [20, DECK_TOP_Y, -6];

// plants.ts renders six separate nasturtium clusters (nasturtium-0 through
// -5) as one continuous flower bed along the rear planters — anchored here
// to the middle cluster rather than adding six near-identical entries; a
// wider interactionRadius (see below) stands in for the whole bed.
export const NASTURTIUM_POSITION: Position = [2, 1, -27];

// Same reasoning as NASTURTIUM_POSITION — plants.ts renders seven separate
// blackberry instances (across blackberry_01/02/03.glb) clustered in the
// back-right corner as one bramble patch. Anchored to blackberry-02-1's own
// position (one real instance, roughly central to the cluster) rather than
// a synthetic centroid; a wide interactionRadius stands in for the patch.
export const BLACKBERRY_POSITION: Position = [15, 1, -24];

// The house's front (yard-facing) door doesn't have its own world-space
// position — it's rendered as a child of House's group, offset from
// HOUSE_POSITION in local space (see FRENCH_DOOR_POSITION in
// houseGeometry.ts). This is a separate, purpose-built trigger point:
// centered on that same wall (HOUSE_POSITION[0]) but at deck height and
// just off the wall face, since that's where a player would actually be
// standing to interact with it — not the door's own render pivot, which
// sits mid-door-height for rendering convenience.
export const BACK_DOORS_POSITION: Position = [
  HOUSE_POSITION[0],
  DECK_TOP_Y,
  -0.5,
];

export const interactiveObjects: InteractiveObjectData[] = [
  {
    id: 'strawberry-pot',
    title: 'Strawberry Pot',
    description:
      'The terra cotta pot lasted far longer than the berries ever did. We grew strawberries in the front yard too, next to the baby pine tree I planted which was later cut down (</3) because it grew so big and strong that its roots started cracking and lifting the concrete walkway to the house. ',
    position: STRAWBERRY_POT_POSITION,
    interactionRadius: 2.5,
    prompt:
      'A plump berry is ready to pick! Will you pick it? Press E to inspect.',
    viewerModel: '/models/strawberry.glb',
    // 'none': the pot itself is already rendered by Backyard.tsx (as the real
    // GLB prop) — this entry only adds proximity detection and the popup.
    visual: { kind: 'none' },
  },
  {
    // TODO: template entry — fill in title/description/prompt once there's
    // real copy for this one; interactionRadius/visual are reasonable
    // defaults for a real GLB prop (mirrors strawberry-pot's shape).
    id: 'lemon-tree',
    title: 'Lemon Tree',
    description:
      'We had two lemon trees but only one stands now. One tree was home to a bluejay for some years. He would land on my head and eat peanuts out of my hand. The Meyer lemon tree drew stealthy neighbors into the backyard, its fruit traveled thousands of miles every year as gifts for grandmas and produced countless jugs of perfectly refreshing lemonade. ',
    position: LEMON_TREE_POSITION,
    interactionRadius: 2.5,
    prompt: 'Press E to inspect',
    // 'none': the tree itself is already rendered by Backyard.tsx via
    // plants.ts (as the real GLB prop) — this entry only adds proximity
    // detection and the popup.
    visual: { kind: 'none' },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'plum-tree',
    title: 'Plum Tree',
    description:
      'Juicy, sweet, dark plums, the only plums I’ve ever loved. The tree is gone now. I don’t eat plums anymore; they have become a source of deep disappointment. Each pithy, hard, flavorless plum I eat causes me to question the memory of the delicious plums I once knew… I avoid plums now to preserve the memory of the plums I loved so much. ',
    position: PLUM_TREE_POSITION,
    interactionRadius: 2.5,
    prompt: 'Press E to inspect',
    // 'none': already rendered by Backyard.tsx via plants.ts.
    visual: { kind: 'none' },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'garden-shed',
    title: 'Garden Shed',
    description:
      'I don’t go in here; I don’t know what is in here. This shed wasn’t around when I was young, it is evidence of passing time and a reminder of my absence. I’m not sure when it got there. ',
    position: GARDEN_SHED_POSITION,
    interactionRadius: 3,
    prompt: 'Press E to inspect',
    visual: { kind: 'none' },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'yard-tree',
    title: 'Yard Tree',
    description:
      'The most beautiful and bountiful pink flowers bloom from this camellia bush (which looks much more like a tree than a bush) but when the flowers fall they create a disgusting mass grave of rotting brown flower corpses. Something so beautiful can be so foul. ',
    position: YARD_TREE_POSITION,
    interactionRadius: 2.5,
    prompt: 'Press E to inspect',
    visual: { kind: 'none' },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'bougainvillea',
    title: 'Bougainvillea',
    description:
      'The most vibrant color, an explosion of papery petals, such an unnatural hue. This vine would grow largely untamed, for years, until it would begin to fall and encroach upon the walkway on the side of the house used by occasionally by us and, more often, local deer. Dad used wire and screws to train it against the fence, but no more than necessary. ',
    position: BOUGAINVILLEA_POSITION,
    interactionRadius: 2.5,
    prompt: 'Press E to inspect',
    visual: { kind: 'none' },
  },
  {
    // TODO: template entry — fill in title/description/prompt. Wider radius
    // than the other props since this one stands in for a spread-out
    // 6-cluster flower bed (see NASTURTIUM_POSITION above), not one object.
    id: 'nasturtiums',
    title: 'Nasturtiums',
    description:
      'Grandma told me these flowers are edible so I would try one every-once-in-a-while, just to confirm. They would be a great addition to a fancy salad... Spicy, peppery, and sweet depending on age. Also, Beaches’ favorite resting spot. ',
    position: NASTURTIUM_POSITION,
    interactionRadius: 4,
    prompt: 'Press E to inspect',
    visual: { kind: 'none' },
  },
  {
    // TODO: template entry — fill in title/description/prompt. Wider radius
    // (and looser fit than nasturtiums') since this stands in for a
    // 7-instance bramble patch spread across ~20x11 units (see
    // BLACKBERRY_POSITION above), not one object.
    id: 'blackberries',
    title: 'Blackberry Bushes',
    description:
      'An unruly bush beaten back once a year by my father, many harvests in the summertime ensured a surplus stock of frozen blackberries all year for pancakes and pies. My neighbor Myrna taught me how to bake my first pie with the berries from our yard. She lived on the corner, two doors down. The walls of her home were lined with hundreds of antique salt and pepper shakers. ',
    position: BLACKBERRY_POSITION,
    interactionRadius: 6,
    prompt: 'Press E to inspect',
    visual: { kind: 'none' },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'deck-chair',
    title: 'Deck Chair',
    description:
      'An ideal spot to enjoy a chocolate old fashioned from Red’s or a cinnamon roll from Pavel’s with a banana and black coffee, while reading the weekly newspaper to find a movie or play to attend. Maybe the outdoor forest theatre is open this time of year? ',
    position: DECK_CHAIR_POSITION,
    interactionRadius: 1.5,
    prompt: 'Press E to inspect',
    visual: { kind: 'none' },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'back-doors',
    title: 'Back Doors',
    description:
      'The French doors were installed backwards by the previous owner. They have since been replaced.',
    position: BACK_DOORS_POSITION,
    interactionRadius: 2,
    prompt: 'Press E to inspect',
    // 'none': the doors are rendered by House.tsx, not plants.ts, but the
    // pattern's the same — this entry only adds proximity/popup on top.
    visual: { kind: 'none' },
  },
  {
    id: 'stair-top',
    title: 'Deck Stairs',
    description: '',
    position: STAIR_TOP_POSITION,
    interactionRadius: 1.8,
    prompt: 'Press E to go down to the yard',
    action: 'descend-stairs',
    // The stairs themselves are already rendered by Deck.tsx.
    visual: { kind: 'none' },
  },
  {
    id: 'stair-bottom',
    title: 'Deck Stairs',
    description: '',
    position: STAIR_BASE_POSITION,
    interactionRadius: 1.8,
    prompt: 'Press E to go up to the deck',
    action: 'ascend-stairs',
    visual: { kind: 'none' },
  },
];
