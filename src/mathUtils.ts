// Shortest angular path from `from` to `to`. Yaw values in this project
// accumulate freely while turning (no wraparound), so a naive lerp between
// an accumulated yaw and a small canonical target angle could spin the long
// way around; this keeps a smoothed turn to at most half a revolution.
export function shortestYawDelta(from: number, to: number) {
  const diff = (to - from) % (Math.PI * 2)
  return ((diff + Math.PI * 3) % (Math.PI * 2)) - Math.PI
}

// Deterministic hash (no external seed/state) so procedural placement is
// stable across reloads instead of reshuffling every mount.
export function hash(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}
