// length/startOffset are each asset's own real-world span along its local X
// axis (its "length" axis) and where that span starts relative to the
// asset's own origin — read once via `gltf-transform inspect` on the
// processed GLB, not something to recompute at runtime.
export interface FenceSegment {
  url:         string
  length:      number
  startOffset: number
}

export const FENCE_LEFT: FenceSegment  = { url: '/models/fence/left.glb',  length: 12.97691, startOffset: -4.93329 }
export const FENCE_REAR: FenceSegment  = { url: '/models/fence/rear.glb',  length: 10.5348,  startOffset: 0 }
export const FENCE_RIGHT: FenceSegment = { url: '/models/fence/right.glb', length: 13.09767, startOffset: 0 }
