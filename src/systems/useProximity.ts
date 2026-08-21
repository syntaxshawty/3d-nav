import { useRef, type MutableRefObject, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Group } from 'three';
import {
  interactiveObjects,
  type InteractiveObject,
  type InteractionTrigger,
} from '../data/interactiveObjects';
import { yardObjects } from '../data/yardObjects';
import type { PlayerController } from './playerController';

// yardObjects.ts is the one source of truth for a rendered object's actual
// position — looked up by id when resolving an interactionTrigger below.
const YARD_OBJECT_POSITIONS = new Map(
  yardObjects.map((o) => [o.id, new Vector3(...o.position)]),
);

function resolveTriggerPosition(trigger: InteractionTrigger): Vector3 {
  if ('coords' in trigger) return new Vector3(...trigger.coords);

  const basePosition = YARD_OBJECT_POSITIONS.get(trigger.objectId);
  if (!basePosition) {
    throw new Error(
      `interactionTrigger references unknown yardObjects id "${trigger.objectId}"`,
    );
  }
  const [ox, oy, oz] = trigger.offset ?? [0, 0, 0];
  return new Vector3(
    basePosition.x + ox,
    basePosition.y + oy,
    basePosition.z + oz,
  );
}

// Pre-computed once at module load — useFrame reads these without allocating per frame.
// Stays in sync with interactiveObjects because it maps the same array.
const OBJECT_POSITIONS = interactiveObjects.map((o) =>
  resolveTriggerPosition(o.interactionTrigger),
);

// Finds the nearest interactive object within range each frame, writes it
// into nearbyObjectRef (read by GardenView's Enter-key handler), and drives
// the on-screen ProximityHint prompt directly via the DOM.
export function useProximity(
  groupRef: RefObject<Group>,
  nearbyObjectRef: MutableRefObject<InteractiveObject | null>,
  playerRef: MutableRefObject<PlayerController>,
) {
  // Exposed only for the dev debug overlay.
  const closestDistRef = useRef(Infinity);

  useFrame(() => {
    const pos = groupRef.current.position;

    // Single loop over all objects so "nearest in range" is unambiguous.
    // Each object declares its own interactionRadius in the data file.
    // closestDist tracks distance to the nearest object overall (any
    // distance, for the debug overlay); closestEligibleDist is the
    // separate running minimum among objects the player is actually
    // inside the interactionRadius of — that's what picks `found`, so two
    // overlapping radii resolve to whichever is truly closer, not
    // whichever happens to come first in the array.
    let found: InteractiveObject | null = null;
    let closestDist = Infinity;
    let closestEligibleDist = Infinity;
    for (let i = 0; i < interactiveObjects.length; i++) {
      const d = pos.distanceTo(OBJECT_POSITIONS[i]);
      if (d < closestDist) closestDist = d;
      if (
        d < interactiveObjects[i].interactionRadius &&
        d < closestEligibleDist
      ) {
        found = interactiveObjects[i];
        closestEligibleDist = d;
      }
    }
    nearbyObjectRef.current = found;
    closestDistRef.current = closestDist;

    // interactionPrompt: update caption text from data and fade visibility — no React
    // re-render. Only the caption span's text is touched; the Enter-key SVG
    // stays in place so the opacity transition on the container fades the
    // whole hint as a unit instead of the key glyph popping in and out.
    // Hidden during the scripted stair transition itself so it doesn't flash
    // "Enter" again mid-animation, on approach to the opposite end's
    // trigger, and hidden while the overlay is open (playerRef.movementLock).
    const promptEl = document.getElementById('prompt');
    if (promptEl) {
      if (
        found &&
        !playerRef.current.transitioning &&
        !playerRef.current.movementLock
      ) {
        const captionEl = document.getElementById('prompt-caption');
        if (captionEl) captionEl.textContent = found.interactionPrompt;
        promptEl.style.opacity = '1';
      } else {
        promptEl.style.opacity = '0';
      }
    }
  });

  return { closestDistRef };
}
