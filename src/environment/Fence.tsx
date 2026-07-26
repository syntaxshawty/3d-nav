import { GltfProp } from '../components/GltfProp'
import type { FenceSegment } from '../data/fenceSegments'

// ── Fence ────────────────────────────────────────────────────────────────
// Each yard edge is one pre-built fence-run asset (posts, rails, and pickets
// already assembled) repeated end-to-end to cover the edge's full length.
// Replaces the old piece-by-piece post/rail/plank layout system, which had
// to compose four different piece types and pick plank variants by hand.

// Uniform size multiplier applied to every axis, on top of each segment's
// native size — raise this to make the whole fence bigger (taller, thicker,
// and each panel spanning more ground), not just stretched lengthwise.
const FENCE_SCALE = 3

export function FenceRun({
  segment, x0, z0, x1, z1, flip,
}: {
  segment: FenceSegment
  x0: number; z0: number; x1: number; z1: number
  // Mirrors the panel across its thickness (negates local Z scale) so the
  // face that was pointing away from the yard now points into it — e.g. to
  // show the support beams instead of the finished picket face. A real 180°
  // turn would also reverse which way the segment's length axis tiles along
  // the edge, which would need the anchor math reworked too; mirroring the
  // thin axis gets the same visual result (the material is double-sided —
  // see Fence.tsx's source inspect — so there's no backface-culling risk)
  // without touching how repeats are placed.
  flip?: boolean
}) {
  const dx = x1 - x0
  const dz = z1 - z0
  const totalLength = Math.hypot(dx, dz)
  // rotation.y mapping local +X (the asset's own length axis) to the (dx, dz) direction
  const angle = Math.atan2(-dz, dx)
  const dirX = dx / totalLength
  const dirZ = dz / totalLength

  // Real-world length of one segment once FENCE_SCALE is applied — repeats
  // are computed from this, not the asset's raw native length, so scaling
  // the fence up also means fewer, larger panels covering the same edge.
  const scaledLength = segment.length * FENCE_SCALE
  const repeats = Math.max(1, Math.round(totalLength / scaledLength))
  const pitch   = totalLength / repeats
  // Small stretch/compress (a few–10%) on top of FENCE_SCALE so repeats meet
  // the corners exactly, no gap or overlap.
  const scaleX  = FENCE_SCALE * (pitch / scaledLength)

  return (
    <>
      {Array.from({ length: repeats }, (_, i) => {
        // Anchor each repeat so the asset's own geometry (which may start at
        // a nonzero startOffset, not necessarily its own origin) begins
        // exactly at this repeat's point along the edge.
        const anchorDist = i * pitch - segment.startOffset * scaleX
        return (
          <GltfProp
            key={`${segment.url}-${i}`}
            url={segment.url}
            position={[x0 + dirX * anchorDist, 0, z0 + dirZ * anchorDist]}
            rotation={[0, angle, 0]}
            scale={[scaleX, FENCE_SCALE, flip ? -FENCE_SCALE : FENCE_SCALE]}
          />
        )
      })}
    </>
  )
}
