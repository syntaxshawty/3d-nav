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

// Shared by every interactive object regardless of what happens on
// interact — proximity detection (position/interactionRadius), the prompt
// caption, and animation (see the note on InteractiveActionTrigger.action
// below for why animation lives here and not only on content objects).
interface InteractiveObjectBase {
  id: string;
  position: Position;
  interactionRadius: number; // player must be within this many units to trigger a prompt
  prompt: string; // caption shown next to the Enter-key glyph in the proximity prompt (e.g. "to inspect")
  // If set, E plays this clip name (from cat_animated.glb) once on the
  // player's avatar — see AnimatedCat.tsx. Kept on the shared base, not
  // content objects alone, because App.tsx's E-key handler checks this
  // unconditionally, before it looks at `action` — so an action trigger
  // and an animation can already coexist on one object today, even though
  // no current entry does both. (Animation/effect modeling as its own
  // concern is a separate, later change — not part of this split.)
  animation?: string;
}

// A scripted world action (currently just the two stair triggers) — E
// plays the scripted movement (see the stair-transition handling in
// App.tsx) instead of opening the info overlay, so it carries only what's
// needed to identify and execute that action, not any content/presentation
// fields (those never apply — the overlay never opens for these).
export interface InteractiveActionTrigger extends InteractiveObjectBase {
  action: 'descend-stairs' | 'ascend-stairs';
}

// Fields required by every content object regardless of layout. `action`
// is always undefined here (vs. a required literal on
// InteractiveActionTrigger) — that's the discriminant App.tsx's E-key
// handler narrows on to tell an action trigger from a content object.
export interface InteractiveContentBase extends InteractiveObjectBase {
  action?: undefined;
  title: string;
  description: string;
}

// One interface per layout, each owning only the presentation fields that
// layout actually renders (see the matching FocusLayout* component) —
// `layout` doubles as the discriminant between these three. Each object is
// meant to get its own bespoke layout eventually (see 'newspaper-style'/
// 'strawberry-style' as the model to follow); 'image-row' is the interim
// catch-all for everything that hasn't been given one yet, not a "default"
// to keep reusing long-term.

export interface ImageRowContent extends InteractiveContentBase {
  layout: 'image-row';
  overlayImage?: string; // photo path — shown above the title/description if set
  overlayImageGallery?: string[]; // additional photos, shown alongside overlayImage in the same inline row
}

export interface NewspaperStyleContent extends InteractiveContentBase {
  layout: 'newspaper-style';
  overlayImage: string; // the scanned photo itself — the layout's primary element, so always required
  // Where the readable text pocket sits over the photo — CSS top/left
  // values, positioned absolute within the photo's own box (so it tracks
  // a spot on the page, e.g. blank ad space, regardless of viewport
  // size). Per-object because that spot is different in every scanned
  // photo; falls back to .focus-newspaper-text's default position if omitted.
  newspaperTextPosition?: { top: string; left: string };
}

export interface StrawberryStyleContent extends InteractiveContentBase {
  layout: 'strawberry-style';
  overlayImage: string; // looping gif/video — required, it's one of the layout's two primary elements
  viewerModel: string; // GLB path for the spinnable 3D preview (see ObjectViewer.tsx) — required, the layout's other primary element
}

export type InteractiveContentObject = ImageRowContent | NewspaperStyleContent | StrawberryStyleContent;

export type InteractiveObjectData = InteractiveActionTrigger | InteractiveContentObject;

// Shared with Backyard.tsx so the real strawberry-pot model (rendered there)
// and this proximity/interaction entry always agree on where the pot is.
export const STRAWBERRY_POT_POSITION: Position = [20, DECK_TOP_Y, -10];

// Shared with plants.ts so the real lemon-tree model (rendered there) and
// this proximity/interaction entry always agree on where the tree is —
// same pattern as STRAWBERRY_POT_POSITION above. Only for rendering the
// GLB now — see LEMON_TREE_TRIGGER_POSITION below for the interaction area.
export const LEMON_TREE_POSITION: Position = [5, 0, -7];

// Separate from LEMON_TREE_POSITION on purpose — same reasoning as
// BACK_DOORS_POSITION below: the model's own anchor covers the whole
// tree's footprint (trunk + canopy spread), but the interaction area
// should only cover the trunk/base where a player would actually stand,
// not wherever the wide canopy happens to reach. Starts equal to
// LEMON_TREE_POSITION; nudge independently once you can see the trigger
// circle relative to the canopy in-browser.
export const LEMON_TREE_TRIGGER_POSITION: Position = [2, 0, -5];

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
export const BLACKBERRY_POSITION: Position = [16, 1, -24];

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
      'The terra cotta pot lasted far longer than the berries ever did. We grew strawberries in the front yard too, next to the baby pine tree I planted which was later cut down because it grew so big and strong that its roots started cracking and lifting the concrete walkway to the house... (</3)',
    position: STRAWBERRY_POT_POSITION,
    interactionRadius: 2.5,
    prompt: 'to inspect',
    layout: 'strawberry-style',
    viewerModel: '/models/strawberry.glb',
    overlayImage: '/photos/tree-growth-death.webm',
    // The pot itself is already rendered by Backyard.tsx (as the real GLB
    // prop) — this entry only adds proximity detection and the popup.
  },
  {
    // TODO: template entry — fill in title/description/prompt once there's
    // real copy for this one; interactionRadius is a reasonable default
    // for a real GLB prop (mirrors strawberry-pot's shape).
    id: 'lemon-tree',
    title: 'Lemon Tree',
    description:
      'We had two lemon trees but only one stands now. One tree was home to a bluejay for some years. He would land on my head and eat peanuts out of my hand. The Meyer lemon tree drew stealthy neighbors into the backyard, its fruit traveled thousands of miles every year as gifts for grandmas and produced countless jugs of perfectly refreshing lemonade. ',
    position: LEMON_TREE_TRIGGER_POSITION,
    interactionRadius: 1.5,
    prompt: 'to inspect',
    layout: 'image-row',
    // The tree itself is already rendered by Backyard.tsx via plants.ts
    // (as the real GLB prop) — this entry only adds proximity detection
    // and the popup.
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'plum-tree',
    title: 'Plum Tree',
    description:
      'Juicy, sweet, dark plums, the only plums I’ve ever loved. The tree is gone now. I don’t eat plums anymore; they have become a source of deep disappointment. Each pithy, hard, flavorless plum I eat causes me to question the memory of the delicious plums I once knew… I avoid plums now to preserve the memory of the plums I loved so much. ',
    position: PLUM_TREE_POSITION,
    interactionRadius: 2.5,
    prompt: 'to inspect',
    layout: 'image-row',
    // Already rendered by Backyard.tsx via plants.ts.
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'garden-shed',
    title: 'Garden Shed',
    description:
      'I don’t go in here; I don’t know what is in here. This shed wasn’t around when I was young, it is evidence of passing time and a reminder of my absence. I’m not sure when it got there. ',
    position: GARDEN_SHED_POSITION,
    interactionRadius: 3,
    prompt: 'to inspect',
    layout: 'image-row',
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'yard-tree',
    title: 'Yard Tree',
    description:
      'The most beautiful and bountiful pink flowers bloom from this camellia bush (which looks much more like a tree than a bush) but when the flowers fall they create a disgusting mass grave of rotting brown flower corpses. Something so beautiful can be so foul. ',
    position: YARD_TREE_POSITION,
    interactionRadius: 2.5,
    prompt: 'to inspect',
    layout: 'image-row',
    animation: 'SharpenClaws_Vert',
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'bougainvillea',
    title: 'Bougainvillea',
    description:
      'An explosion of papery petals of such an unnatural hue. This vine would grow and grow, untamed, for years; a seemingly endless bounty of flowers pouring from its arms... and then falling to the ground, leaving a beautiful fuschia carpet. Eventually, the vine would begin to fall, encroaching upon the walkway to the side of the house which was used by occasionally by us, but, more often frequented by local deer. Once neccessary, Dad used wire and screws to train the plant against the fence. On the other side of the house, through the carpetted walkway, were real Fuschia plants (which I just now learned is the origin of the color fuschia... I have always called them ballerina flowers...) ',
    position: BOUGAINVILLEA_POSITION,
    interactionRadius: 2.5,
    prompt: 'to inspect',
    layout: 'image-row',
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
    prompt: 'to inspect',
    layout: 'image-row',
  },
  {
    // TODO: template entry — fill in title/description/prompt. Wider radius
    // (and looser fit than nasturtiums') since this stands in for a
    // 7-instance bramble patch spread across ~20x11 units (see
    // BLACKBERRY_POSITION above), not one object.
    id: 'blackberries',
    title: 'Blackberry Bush',
    description:
      'An unruly bush beaten back once a year by my father, many harvests in the summertime ensured a surplus stock of frozen blackberries all year for pancakes and pies. My neighbor Myrna taught me how to bake my first pie with the berries from our yard. She lived on the corner, two doors down. The walls of her home were lined with hundreds of antique salt and pepper shakers. ',
    overlayImage: '/photos/berry-pie-recipe.png',
    overlayImageGallery: [
      '/photos/pie-1.png',
      '/photos/pie-2.png',
      '/photos/pie-3.png',
      '/photos/pie-4.png',
    ],
    position: BLACKBERRY_POSITION,
    interactionRadius: 2,
    prompt: 'to inspect',
    layout: 'image-row',
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'deck-chair',
    title: 'Deck Chair',
    description:
      'An ideal spot to sip a cup of black coffee in the morning with an underripe banana and a cinnamon roll from Pavel’s. Also a great place to search the weekly newspaper to find a movie or play to attend. Maybe the outdoor forest theatre is open this time of year? (Goodbye Pavels Bakerei, my heart broke when I learned of your closure...)',
    position: DECK_CHAIR_POSITION,
    overlayImage: '/photos/pavels-bakerei.png',
    // overlayImageGallery: ['/photos/reds-donuts.png'],
    // No newspaperTextPosition override — this is the only newspaper-style
    // object right now, so position is tuned directly via
    // .focus-newspaper-text's top/left in FocusLayoutNewspaper.css instead
    // of here. An inline override always wins over that CSS default (see
    // the type comment above), so add one back only once a second object
    // needs a genuinely different position than this one.
    interactionRadius: 2.5,
    prompt: 'to inspect',
    layout: 'newspaper-style',
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'back-doors',
    title: 'Back Doors',
    description:
      'The French doors were installed backwards by the previous owner. They have since been replaced.',
    position: BACK_DOORS_POSITION,
    interactionRadius: 2,
    prompt: 'to inspect',
    layout: 'image-row',
    // The doors are rendered by House.tsx, not plants.ts, but the
    // pattern's the same — this entry only adds proximity/popup on top.
  },
  {
    id: 'stair-top',
    position: STAIR_TOP_POSITION,
    interactionRadius: 1.8,
    prompt: 'to go down to the yard',
    action: 'descend-stairs',
    // The stairs themselves are already rendered by Deck.tsx.
  },
  {
    id: 'stair-bottom',
    position: STAIR_BASE_POSITION,
    interactionRadius: 1.8,
    prompt: 'to go up to the deck',
    action: 'ascend-stairs',
  },
];
