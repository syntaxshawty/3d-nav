import { useMemo } from 'react'
import { hash } from '../mathUtils'

// ── Forest ring constants — tweak to reshape the tree line ────────────────────
const TREE_COUNT     = 56   // trees around the ring
const RING_RADIUS    = 42   // distance from the origin to the tree line
const RADIUS_JITTER  = 6    // random +/- variance so the ring doesn't read as a perfect circle
const ANGLE_JITTER   = 0.06 // random angular offset (radians) so spacing isn't perfectly even
const TREE_HEIGHT_MIN = 5
const TREE_HEIGHT_MAX = 9

const FOLIAGE_COLORS = ['#2f5233', '#356b3b', '#2a4d2e']
const TRUNK_COLOR    = '#5b4230'

function PineTree({
  position, height, color,
}: {
  position: [number, number, number]; height: number; color: string
}) {
  const trunkHeight = height * 0.2
  const trunkRadius = 0.12 + height * 0.008

  // Three tapering cones stacked with a bit of overlap for a fuller silhouette.
  const tier1Y = trunkHeight + height * 0.22
  const tier2Y = trunkHeight + height * 0.46
  const tier3Y = trunkHeight + height * 0.68

  return (
    <group position={position}>
      <mesh position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[trunkRadius * 0.6, trunkRadius, trunkHeight, 6]} />
        <meshStandardMaterial color={TRUNK_COLOR} />
      </mesh>
      <mesh position={[0, tier1Y, 0]}>
        <coneGeometry args={[height * 0.26, height * 0.34, 7]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, tier2Y, 0]}>
        <coneGeometry args={[height * 0.2, height * 0.3, 7]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, tier3Y, 0]}>
        <coneGeometry args={[height * 0.13, height * 0.26, 7]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  )
}

export function PineForest() {
  const trees = useMemo(
    () =>
      Array.from({ length: TREE_COUNT }, (_, i) => {
        const baseAngle = (i / TREE_COUNT) * Math.PI * 2
        const angle  = baseAngle + (hash(i, 1) - 0.5) * ANGLE_JITTER
        const radius = RING_RADIUS + (hash(i, 2) - 0.5) * RADIUS_JITTER
        const height = TREE_HEIGHT_MIN + hash(i, 3) * (TREE_HEIGHT_MAX - TREE_HEIGHT_MIN)
        const color  = FOLIAGE_COLORS[Math.floor(hash(i, 4) * FOLIAGE_COLORS.length) % FOLIAGE_COLORS.length]
        const position: [number, number, number] = [Math.cos(angle) * radius, 0, Math.sin(angle) * radius]
        return { key: i, position, height, color }
      }),
    [],
  )

  return (
    <>
      {trees.map(t => (
        <PineTree key={t.key} position={t.position} height={t.height} color={t.color} />
      ))}
    </>
  )
}
