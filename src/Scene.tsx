import { useEffect, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Movement } from './systems/useInput'
import { usePlayerController } from './systems/usePlayerController'
import { useFollowCamera } from './systems/useFollowCamera'
import { useProximity } from './systems/useProximity'
import { interactiveObjects, type InteractiveObjectData } from './data/interactiveObjects'
import { InteractiveObject } from './components/InteractiveObject'
import { Deck } from './environment/Deck'
import { SPAWN_POS } from './data/spawn'
import { SkyBackground } from './environment/SkyBackground'
import { Clouds } from './environment/Clouds'
import { PineForest } from './environment/PineForest'
import { AnimatedCat } from './components/AnimatedCat'
import { Backyard } from './environment/Backyard'

const GROUND_SIZE = 160  // wide enough that the pine ring and fog hide its edge instead of it cutting off visibly

function Player({
  movement,
  nearbyObjectRef,
  resetRef,
  stairActionRef,
  transitioningRef,
}: {
  movement:         MutableRefObject<Movement>
  nearbyObjectRef:  MutableRefObject<InteractiveObjectData | null>
  resetRef:         MutableRefObject<() => void>
  stairActionRef:   MutableRefObject<(direction: 'down' | 'up') => void>
  transitioningRef: MutableRefObject<boolean>
}) {
  const {
    groupRef, yawRef, movingRef, stairBlendRef, fwdRef, stairOrbitTRef,
    reset: resetPlayer,
  } = usePlayerController(movement, stairActionRef, transitioningRef)
  const { camPosRef, driftActiveRef, reset: resetCamera } = useFollowCamera(
    groupRef, yawRef, fwdRef, stairBlendRef, stairOrbitTRef,
    movement, transitioningRef,
  )
  const { closestDistRef } = useProximity(groupRef, nearbyObjectRef, transitioningRef)

  // Write the reset function into the ref so GardenView can call it from a
  // button. Composes each system's own reset — every system owns resetting
  // exactly the state it owns. Runs once after mount; resetPlayer/
  // resetCamera are stable (useCallback with no deps, closing only over
  // stable refs), so this never needs to re-run.
  useEffect(() => {
    resetRef.current = () => {
      resetPlayer()
      resetCamera()
    }
  }, [resetRef, resetPlayer, resetCamera])

  // ── Debug overlay ──────────────────────────────────────────────────────
  // Dev-only: this element only exists in the DOM at all when
  // import.meta.env.DEV (see GardenView in App.tsx), but skip the
  // getElementById/string-building work outright in production too rather
  // than relying on the `if (el)` null-check alone.
  useFrame(() => {
    const el = import.meta.env.DEV ? document.getElementById('debug') : null
    if (!el) return
    const pos = groupRef.current.position
    const m   = movement.current
    const dirs = ([
      m.forward  && 'W(fwd)',
      m.left     && 'A(turn-L)',
      m.backward && 'S(bwd)',
      m.right    && 'D(turn-R)',
    ] as (string | false)[]).filter(Boolean).join('  ') || 'none'
    const c = camPosRef.current
    el.textContent =
      `player  x: ${pos.x.toFixed(2)}  z: ${pos.z.toFixed(2)}  yaw: ${yawRef.current.toFixed(2)}\n` +
      `moving  ${dirs}\n` +
      `camera  x: ${c.x.toFixed(2)}  y: ${c.y.toFixed(2)}  z: ${c.z.toFixed(2)}\n` +
      `dist    ${closestDistRef.current.toFixed(2)}  nearby: ${nearbyObjectRef.current ? nearbyObjectRef.current.id : 'none'}\n` +
      `drift   ${driftActiveRef.current ? 'YES — active' : 'no'}`
  })

  return (
    // groupRef's position is the player's feet/ground-contact point — used
    // for movement, camera-follow, and proximity checks. This group's own
    // rotation is left untouched (yaw drives the camera/movement math
    // directly, not this transform) so AnimatedCat can smooth its visual
    // turn independently of the controller's instant one.
    <group ref={groupRef} position={SPAWN_POS}>
      <AnimatedCat yawRef={yawRef} movingRef={movingRef} stairBlendRef={stairBlendRef} />
    </group>
  )
}

export function Scene({
  movement,
  nearbyObjectRef,
  resetRef,
  stairActionRef,
  transitioningRef,
}: {
  movement:         MutableRefObject<Movement>
  nearbyObjectRef:  MutableRefObject<InteractiveObjectData | null>
  resetRef:         MutableRefObject<() => void>
  stairActionRef:   MutableRefObject<(direction: 'down' | 'up') => void>
  transitioningRef: MutableRefObject<boolean>
}) {
  return (
    <>
      <SkyBackground />
      <Clouds />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Player
        movement={movement}
        nearbyObjectRef={nearbyObjectRef}
        resetRef={resetRef}
        stairActionRef={stairActionRef}
        transitioningRef={transitioningRef}
      />
      {interactiveObjects.map(obj => (
        <InteractiveObject key={obj.id} data={obj} />
      ))}
      <Deck />
      <PineForest />
      <Backyard />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
        <meshStandardMaterial color="lightgreen" />
      </mesh>
    </>
  )
}
