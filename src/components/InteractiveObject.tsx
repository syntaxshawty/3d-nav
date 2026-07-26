import type { InteractiveObjectData } from '../data/interactiveObjects'

// ── ObjectVisual ──────────────────────────────────────────────────────────────
// Dispatches on visual.kind to render the right geometry.
// Adding a new kind: add one case here + entries in interactiveObjects.ts.
// Nothing else in the codebase needs to change.
function ObjectVisual({ visual }: { visual: InteractiveObjectData['visual'] }) {
  switch (visual.kind) {
    case 'none':
      // The real model is rendered elsewhere in the scene — this entry only
      // needs proximity detection and the interaction prompt.
      return null

    default:
      // Fallback: glowing cube so unknown kinds are always visible in the scene
      return (
        <mesh>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial
            color={visual.color ?? 'hotpink'}
            emissive={visual.color ?? 'hotpink'}
            emissiveIntensity={0.4}
          />
        </mesh>
      )
  }
}

// ── InteractiveObject ─────────────────────────────────────────────────────────
// Renders one garden object at the position declared in its data entry.
// Proximity detection and overlay management are coordinated by Player and
// GardenView so the "which object is nearest" question is never ambiguous
// when multiple objects are in range simultaneously.
export function InteractiveObject({ data }: { data: InteractiveObjectData }) {
  return (
    <group position={data.position}>
      <ObjectVisual visual={data.visual} />
    </group>
  )
}
