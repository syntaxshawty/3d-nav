import { useRef, type MutableRefObject, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type Group } from 'three'
import { interactiveObjects, type InteractiveObjectData } from '../data/interactiveObjects'

// Pre-computed once at module load — useFrame reads these without allocating per frame.
// Stays in sync with interactiveObjects because it maps the same array.
const OBJECT_POSITIONS = interactiveObjects.map(o => new Vector3(...o.position))

// Finds the nearest interactive object within range each frame, writes it
// into nearbyObjectRef (read by GardenView's E-key handler), and drives the
// on-screen "Press E..." prompt directly via the DOM.
export function useProximity(
  groupRef: RefObject<Group>,
  nearbyObjectRef: MutableRefObject<InteractiveObjectData | null>,
  transitioningRef: MutableRefObject<boolean>,
) {
  // Exposed only for the dev debug overlay.
  const closestDistRef = useRef(Infinity)

  useFrame(() => {
    const pos = groupRef.current.position

    // Single loop over all objects so "nearest in range" is unambiguous.
    // Each object declares its own interactionRadius in the data file.
    let found: InteractiveObjectData | null = null
    let closestDist = Infinity
    for (let i = 0; i < interactiveObjects.length; i++) {
      const d = pos.distanceTo(OBJECT_POSITIONS[i])
      if (d < closestDist) closestDist = d
      if (d < interactiveObjects[i].interactionRadius && !found) found = interactiveObjects[i]
    }
    nearbyObjectRef.current = found
    closestDistRef.current  = closestDist

    // Prompt: update text from data and toggle visibility — no React re-render.
    // Hidden during the scripted stair transition itself so it doesn't flash
    // "press E" again mid-animation, on approach to the opposite end's trigger.
    const promptEl = document.getElementById('prompt')
    if (promptEl) {
      if (found && !transitioningRef.current) {
        promptEl.textContent   = found.prompt
        promptEl.style.display = 'block'
      } else {
        promptEl.style.display = 'none'
      }
    }
  })

  return { closestDistRef }
}
