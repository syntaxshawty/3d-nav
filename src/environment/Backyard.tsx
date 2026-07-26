import { Suspense } from 'react'
import { GltfProp } from '../components/GltfProp'
import { FENCE_LEFT, FENCE_REAR, FENCE_RIGHT } from '../data/fenceSegments'
import { plants } from '../data/plants'
import { FenceRun } from './Fence'

// ── Yard boundary ──────────────────────────────────────────────────────────
// Local axes match Deck.tsx: X = along the house wall, Z = away from the
// house (house/doors sit at Z=0 — no fence on that side). This rectangle
// comfortably contains the existing deck footprint (X:[-4,26], Z:[-12.5,0])
// with room for lawn, matching the sketch's proportions.
const YARD_LEFT_X  = -8
const YARD_RIGHT_X = 30
const YARD_BACK_Z  = -28
const YARD_FRONT_Z = 0

export function Backyard() {
  return (
    <Suspense fallback={null}>
      <FenceRun segment={FENCE_LEFT}  x0={YARD_LEFT_X}  z0={YARD_FRONT_Z} x1={YARD_LEFT_X}  z1={YARD_BACK_Z} flip />
      <FenceRun segment={FENCE_REAR}  x0={YARD_LEFT_X}  z0={YARD_BACK_Z}  x1={YARD_RIGHT_X} z1={YARD_BACK_Z} />
      <FenceRun segment={FENCE_RIGHT} x0={YARD_RIGHT_X} z0={YARD_BACK_Z}  x1={YARD_RIGHT_X} z1={YARD_FRONT_Z} flip />

      {plants.map(plant => (
        <GltfProp
          key={plant.id}
          url={plant.url}
          position={plant.position}
          rotation={plant.rotation}
          scale={plant.scale}
        />
      ))}
    </Suspense>
  )
}
