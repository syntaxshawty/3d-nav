import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Cloud } from '@react-three/drei'
import type { Group } from 'three'
import { hash } from '../mathUtils'

// ── Cloud sky constants — tweak to reshape the depth/parallax feel ────────────
// Clouds sit in three concentric rings around the player (near/mid/far),
// scattered around the full horizon instead of clustered overhead. Each ring
// exposes its own height, radius ("spread"/"depth" from the player), puff
// scale, and angular drift speed — farther rings are deliberately smaller,
// fainter, and slower, which is what sells the parallax depth illusion.

// No clouds closer than this, in any ring — keeps the sky directly above the
// player open instead of feeling like a low ceiling.
const CLOUD_INNER_CLEAR_RADIUS = 55

type CloudLayer = {
  count: number                          // how many clouds in this ring
  radiusMin: number; radiusMax: number   // "spread"/"depth" — horizontal distance band from the player
  height: number; heightVary: number     // altitude, plus random variance per cloud
  scale: [number, number, number]        // puff-volume bounds — bigger = closer-reading cloud
  volume: number                         // puffiness/density
  opacity: number                        // lower = lighter/hazier, for distant atmospheric fade
  driftSpeed: number                     // radians/sec the whole ring slowly rotates around the player
}

const CLOUD_LAYERS: CloudLayer[] = [
  {
    // Near ring — biggest, most solid-looking, drifts fastest (still slow).
    count: 6,
    radiusMin: CLOUD_INNER_CLEAR_RADIUS, radiusMax: 85,
    height: 34, heightVary: 6,
    scale: [14, 3, 9],
    volume: 14,
    opacity: 0.8,
    driftSpeed: 0.008,
  },
  {
    // Mid ring — smaller and fainter, sits higher and further out.
    count: 5,
    radiusMin: 95, radiusMax: 130,
    height: 48, heightVary: 9,
    scale: [10, 2.2, 7],
    volume: 9,
    opacity: 0.5,
    driftSpeed: 0.005,
  },
  {
    // Far ring — small, pale, barely-moving background clouds near the
    // horizon's edge, reinforcing how much world lies beyond the treeline.
    count: 4,
    radiusMin: 140, radiusMax: 180,
    height: 65, heightVary: 14,
    scale: [7, 1.6, 5],
    volume: 5,
    opacity: 0.3,
    driftSpeed: 0.003,
  },
]

function DriftingCloud({
  radius, angle0, y, scale, volume, opacity, seed, driftSpeed,
}: {
  radius: number; angle0: number; y: number
  scale: [number, number, number]; volume: number; opacity: number
  seed: number; driftSpeed: number
}) {
  const groupRef = useRef<Group>(null!)

  useFrame((state) => {
    const angle = angle0 + state.clock.elapsedTime * driftSpeed
    groupRef.current.position.x = Math.cos(angle) * radius
    groupRef.current.position.z = Math.sin(angle) * radius
  })

  return (
    <group ref={groupRef} position={[Math.cos(angle0) * radius, y, Math.sin(angle0) * radius]}>
      <Cloud seed={seed} bounds={scale} volume={volume} opacity={opacity} color="white" fade={40} />
    </group>
  )
}

export function Clouds() {
  const clouds = useMemo(() => {
    const all: {
      key: string; radius: number; angle0: number; y: number
      scale: [number, number, number]; volume: number; opacity: number
      seed: number; driftSpeed: number
    }[] = []

    CLOUD_LAYERS.forEach((layer, layerIndex) => {
      for (let i = 0; i < layer.count; i++) {
        const seed = layerIndex * 100 + i
        // Evenly spaced around the full horizon, with jitter so it doesn't
        // read as a mechanically perfect ring.
        const baseAngle = (i / layer.count) * Math.PI * 2
        const angle0 = baseAngle + (hash(seed, 1) - 0.5) * (Math.PI / layer.count)
        const radius  = layer.radiusMin + hash(seed, 2) * (layer.radiusMax - layer.radiusMin)
        const y       = layer.height + (hash(seed, 3) - 0.5) * 2 * layer.heightVary

        all.push({
          key: `${layerIndex}-${i}`,
          radius, angle0, y,
          scale: layer.scale,
          volume: layer.volume,
          opacity: layer.opacity,
          seed,
          driftSpeed: layer.driftSpeed,
        })
      }
    })

    return all
  }, [])

  return (
    <>
      {clouds.map(c => (
        <DriftingCloud
          key={c.key}
          radius={c.radius}
          angle0={c.angle0}
          y={c.y}
          scale={c.scale}
          volume={c.volume}
          opacity={c.opacity}
          seed={c.seed}
          driftSpeed={c.driftSpeed}
        />
      ))}
    </>
  )
}
