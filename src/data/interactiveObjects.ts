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
// yardObjects.ts that share one) so a single type describes "a point in
// world space" everywhere, instead of each file redeclaring its own
// [number, number, number] tuple.
export type Position = Vector3Tuple;

// Where a proximity trigger sits in world space. yardObjects.ts is the one
// source of truth for a rendered object's actual position/scale/rotation —
// most triggers just reference that object's id (+ an optional local
// offset, for when the trigger should sit somewhere other than the model's
// own origin, e.g. a tree's trunk rather than its whole canopy). `coords`
// is only for triggers with no corresponding rendered prop at all, like
// the stairs (rendered by Deck.tsx) or the back doors (House.tsx).
export type InteractionTrigger =
  | { objectId: string; offset?: Position }
  | { coords: Position };

export type Action =
  | { type: 'open-overlay'; overlay: OverlayStyle }
  | { type: 'ascend-stairs' }
  | { type: 'descend-stairs' };

// Shared by every interactive object regardless of what happens on
// interact — proximity detection (interactionTrigger/interactionRadius),
// the prompt caption, and animation (see the note on
// InteractiveActionTrigger.action below for why animation lives here and
// not only on content objects).
export interface InteractiveObject {
  id: string;
  title: string;
  interactionTrigger: InteractionTrigger;
  interactionRadius: number; // player must be within this many units to trigger a prompt
  interactionPrompt: string; // caption shown next to the Enter-key glyph in the proximity prompt (e.g. "to inspect")
  animation?: string;
  action: Action;
}

// One interface per layout, each owning only the presentation fields that
// layout actually renders (see the matching FocusLayout* component) —
// `layout` doubles as the discriminant between these three. Each object is
// meant to get its own bespoke layout eventually (see 'newspaper-style'/
// 'strawberry-style' as the model to follow); 'image-row' is the interim
// catch-all for everything that hasn't been given one yet, not a "default"
// to keep reusing long-term.

export interface PlaceholderOverlay {
  layout: 'image-row';
  description: string;
  overlayImage?: string; // photo path — shown above the title/description if set
  overlayImageGallery?: string[]; // additional photos, shown alongside overlayImage in the same inline row
}

export interface NewspaperOverlay {
  layout: 'newspaper-style';
  description: string;
  overlayImage: string; // the scanned photo itself — the layout's primary element, so always required
}

export interface StrawberryOverlay {
  layout: 'strawberry-style';
  description: string;
  overlayImage: string; // looping gif/video — required, it's one of the layout's two primary elements
  viewerModel: string; // GLB path for the spinnable 3D preview (see ObjectViewer.tsx) — required, the layout's other primary element
}

export type OverlayStyle =
  | PlaceholderOverlay
  | NewspaperOverlay
  | StrawberryOverlay;

// The house's front (yard-facing) door doesn't have its own world-space
// position — it's rendered as a child of House's group, offset from
// HOUSE_POSITION in local space (see FRENCH_DOOR_POSITION in
// houseGeometry.ts), and isn't in yardObjects.ts at all. This is a
// separate, purpose-built trigger point: centered on that same wall
// (HOUSE_POSITION[0]) but at deck height and just off the wall face, since
// that's where a player would actually be standing to interact with it —
// not the door's own render pivot, which sits mid-door-height for
// rendering convenience.
export const BACK_DOORS_POSITION: Position = [
  HOUSE_POSITION[0],
  DECK_TOP_Y,
  -0.5,
];

export const interactiveObjects: InteractiveObject[] = [
  {
    id: 'strawberry-pot',
    title: 'Strawberry Pot',
    interactionTrigger: { objectId: 'strawberry-pot' },
    interactionRadius: 2.5,
    interactionPrompt: 'to inspect',
    // The pot itself is already rendered by yardObjects.ts (as the real
    // GLB prop) — this entry only adds proximity detection and the popup.
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'strawberry-style',
        description:
          'The terra cotta pot lasted far longer than the berries ever did. We grew strawberries in the front yard too, next to the baby pine tree I planted which was later cut down because it grew so big and strong that its roots started cracking and lifting the concrete walkway to the house... (</3)',
        viewerModel: '/models/strawberry.glb',
        overlayImage: '/photos/tree-growth-death.webm',
      },
    },
  },
  {
    // TODO: template entry — fill in title/description/prompt once there's
    // real copy for this one; interactionRadius is a reasonable default
    // for a real GLB prop (mirrors strawberry-pot's shape).
    id: 'lemon-tree',
    title: 'Lemon Tree',
    // Offset from the tree's own render position (yardObjects.ts) so the
    // trigger sits near the trunk/base rather than centered on the whole
    // canopy's spread — the interaction area should only cover where a
    // player would actually stand, not wherever the wide canopy reaches.
    interactionTrigger: { objectId: 'lemon-tree', offset: [-3, 0, 2] },
    interactionRadius: 1.5,
    interactionPrompt: 'to inspect',
    // The tree itself is already rendered by yardObjects.ts (as the real
    // GLB prop) — this entry only adds proximity detection and the popup.
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'image-row',
        description:
          'We had two lemon trees but only one stands now. One tree was home to a bluejay for some years. He would land on my head and eat peanuts out of my hand. The Meyer lemon tree drew stealthy neighbors into the backyard, its fruit traveled thousands of miles every year as gifts for grandmas and produced countless jugs of perfectly refreshing lemonade. ',
      },
    },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'plum-tree',
    title: 'Plum Tree',
    interactionTrigger: { objectId: 'plum-tree' },
    interactionRadius: 2.5,
    interactionPrompt: 'to inspect',
    // Already rendered by yardObjects.ts.
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'image-row',
        description:
          'Juicy, sweet, dark plums, the only plums I’ve ever loved. The tree is gone now. I don’t eat plums anymore; they have become a source of deep disappointment. Each pithy, hard, flavorless plum I eat causes me to question the memory of the delicious plums I once knew… I avoid plums now to preserve the memory of the plums I loved so much. ',
      },
    },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'garden-shed',
    title: 'Garden Shed',
    interactionTrigger: { objectId: 'garden-shed' },
    interactionRadius: 3,
    interactionPrompt: 'to inspect',
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'image-row',
        description:
          'I don’t go in here; I don’t know what is in here. This shed wasn’t around when I was young, it is evidence of passing time and a reminder of my absence. I’m not sure when it got there. ',
      },
    },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'yard-tree',
    title: 'Yard Tree',
    interactionTrigger: { objectId: 'yard-tree' },
    interactionRadius: 2.5,
    interactionPrompt: 'to inspect',
    animation: 'SharpenClaws_Vert',
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'image-row',
        description:
          'The most beautiful and bountiful pink flowers bloom from this camellia bush (which looks much more like a tree than a bush) but when the flowers fall they create a disgusting mass grave of rotting brown flower corpses. Something so beautiful can be so foul. ',
      },
    },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'bougainvillea',
    title: 'Bougainvillea',
    interactionTrigger: { objectId: 'bougainvillea' },
    interactionRadius: 2.5,
    interactionPrompt: 'to inspect',
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'image-row',
        description:
          'An explosion of papery petals of such an unnatural hue. This vine would grow and grow, untamed, for years; a seemingly endless bounty of flowers pouring from its arms... and then falling to the ground, leaving a beautiful fuschia carpet. Eventually, the vine would begin to fall, encroaching upon the walkway to the side of the house which was used by occasionally by us, but, more often frequented by local deer. Once neccessary, Dad used wire and screws to train the plant against the fence. On the other side of the house, through the carpetted walkway, were real Fuschia plants (which I just now learned is the origin of the color fuschia... I have always called them ballerina flowers...) ',
      },
    },
  },
  {
    // TODO: template entry — fill in title/description/prompt. Wider radius
    // than the other props since this one stands in for a spread-out
    // 6-cluster flower bed (nasturtium-0 through -5 in yardObjects.ts),
    // not one object — anchored to nasturtium-1, the middle cluster.
    id: 'nasturtiums',
    title: 'Nasturtiums',
    interactionTrigger: { objectId: 'nasturtium-1' },
    interactionRadius: 4,
    interactionPrompt: 'to inspect',
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'image-row',
        description:
          'Grandma told me these flowers are edible so I would try one every-once-in-a-while, just to confirm. They would be a great addition to a fancy salad... Spicy, peppery, and sweet depending on age. Also, Beaches’ favorite resting spot. ',
      },
    },
  },
  {
    // TODO: template entry — fill in title/description/prompt. Wider radius
    // (and looser fit than nasturtiums') since this stands in for a
    // 7-instance bramble patch spread across ~20x11 units, not one object.
    id: 'blackberries',
    title: 'Blackberry Bush',
    // blackberry-02-1 is one of seven blackberry instances in
    // yardObjects.ts for this bramble patch. The offset is large because
    // it's reproducing this entry's previous standalone trigger position,
    // which had drifted away from blackberry-02-1's actual position over
    // time (not a deliberate "stand here, not there" offset like
    // lemon-tree's) — a placeholder pending a proper re-tune.
    interactionTrigger: { objectId: 'blackberry-02-1', offset: [-19, 0, 3] },
    interactionRadius: 2,
    interactionPrompt: 'to inspect',
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'image-row',
        description:
          'An unruly bush beaten back once a year by my father, many harvests in the summertime ensured a surplus stock of frozen blackberries all year for pancakes and pies. My neighbor Myrna taught me how to bake my first pie with the berries from our yard. She lived on the corner, two doors down. The walls of her home were lined with hundreds of antique salt and pepper shakers. ',
        overlayImage: '/photos/berry-pie-recipe.png',
        overlayImageGallery: ['/photos/pie-1.png', '/photos/pie-3.png'],
      },
    },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'deck-chair',
    title: 'Deck Chair',
    interactionTrigger: { objectId: 'deck-chair' },
    interactionRadius: 2.5,
    interactionPrompt: 'to inspect',
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'newspaper-style',
        description:
          'An ideal spot to sip a cup of black coffee in the morning with an underripe banana and a cinnamon roll from Pavel’s. Also a great place to search the weekly newspaper to find a movie or play to attend. Maybe the outdoor forest theatre is open this time of year? (Goodbye Pavels Bakerei, my heart broke when I learned of your closure...)',
        overlayImage: '/photos/pavels-bakerei.png',
        // overlayImageGallery: ['/photos/reds-donuts.png'],
      },
    },
  },
  {
    // TODO: template entry — fill in title/description/prompt.
    id: 'back-doors',
    title: 'Back Doors',
    interactionTrigger: { coords: BACK_DOORS_POSITION },
    interactionRadius: 2,
    interactionPrompt: 'to inspect',
    // The doors are rendered by House.tsx, not yardObjects.ts, but the
    // pattern's the same — this entry only adds proximity/popup on top.
    action: {
      type: 'open-overlay',
      overlay: {
        layout: 'image-row',
        description:
          'The French doors were installed backwards by the previous owner. They have since been replaced.',
      },
    },
  },
  {
    id: 'stair-top',
    title: 'Stairs',
    interactionTrigger: { coords: STAIR_TOP_POSITION },
    interactionRadius: 1.8,
    interactionPrompt: 'to go down to the yard',
    // The stairs themselves are already rendered by Deck.tsx.
    action: { type: 'descend-stairs' },
  },
  {
    id: 'stair-bottom',
    title: 'Stairs',
    interactionTrigger: { coords: STAIR_BASE_POSITION },
    interactionRadius: 1.8,
    interactionPrompt: 'to go up to the deck',
    action: { type: 'ascend-stairs' },
  },
];
