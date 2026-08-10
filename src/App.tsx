import { useState, useEffect, useRef, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useInput } from './systems/useInput'
import { type InteractiveObjectData } from './data/interactiveObjects'
import { ObjectViewer } from './components/ObjectViewer'
import { ControlsHint } from './components/ControlsHint'
import { Scene } from './Scene'
import { SPAWN_CAM_POS } from './data/spawn'

// ── Scale / child's-eye-view tuning ─────────────────────────────────────────
const CAM_FOV = 58   // narrower than a fisheye-wide FOV — keeps the world from feeling flat/distant

// ── Interaction overlay pacing ───────────────────────────────────────────────
const OVERLAY_OPEN_DELAY    = 1500   // ms — pause after pressing E before the modal begins to appear, so it reads as a considered beat rather than an instant popup
const OVERLAY_FADE_DURATION = 0.4   // seconds — opacity transition once it starts appearing

// The walking scene: owns all state, renders HTML layer + Canvas
function GardenView() {
  const movement       = useInput()
  const nearbyObjectRef = useRef<InteractiveObjectData | null>(null)
  const playerReset     = useRef<() => void>(() => {})
  const stairAction     = useRef<(direction: 'down' | 'up') => void>(() => {})
  const transitioning   = useRef(false)
  const playAnimation   = useRef<(clip: string) => void>(() => {})
  const animationLock   = useRef(false)

  const [activeObject, setActiveObject] = useState<InteractiveObjectData | null>(null)
  // Drives the overlay's opacity — kept separate from activeObject itself so
  // the modal can mount (invisible, non-interactive) immediately and then
  // fade in after a short delay, instead of popping in the instant E is
  // pressed. Reset to false the moment activeObject clears, so closing stays
  // instant rather than fading back out.
  const [overlayVisible, setOverlayVisible] = useState(false)
  // showHint starts true; set to false the first time any movement key is pressed.
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    if (!activeObject) {
      setOverlayVisible(false)
      return
    }
    const timeout = setTimeout(() => setOverlayVisible(true), OVERLAY_OPEN_DELAY)
    return () => clearTimeout(timeout)
  }, [activeObject])

  // Interaction on E: objects with a scripted `action` (the stair trigger
  // points) play that instead of opening the info overlay. Blocked while a
  // transition is already playing, so it can't be restarted mid-animation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'e' && e.key !== 'E') || !nearbyObjectRef.current || activeObject || transitioning.current) return
      const obj = nearbyObjectRef.current
      if (obj.animation) playAnimation.current(obj.animation)
      if (obj.action === 'descend-stairs')      stairAction.current('down')
      else if (obj.action === 'ascend-stairs')  stairAction.current('up')
      else                                       setActiveObject(obj)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeObject])

  // Fade the controls hint the first time the user presses any movement key.
  // Once dismissed, we remove the listener — no ongoing overhead.
  useEffect(() => {
    const MOVE_KEYS = new Set(['w','W','s','S','a','A','d','D',
      'ArrowUp','ArrowDown','ArrowLeft','ArrowRight'])
    const onFirstMove = (e: KeyboardEvent) => {
      if (MOVE_KEYS.has(e.key)) {
        setShowHint(false)
        window.removeEventListener('keydown', onFirstMove)
      }
    }
    window.addEventListener('keydown', onFirstMove)
    return () => window.removeEventListener('keydown', onFirstMove)
  }, [])

  return (
    <>
      <ControlsHint visible={showHint} />

      {/* Reset button — always visible, top-right corner */}
      <button className="reset-button" onClick={() => playerReset.current()}>
        take me home
      </button>

      {/* Debug overlay — dev-only */}
      {import.meta.env.DEV && (
        <pre id="debug" className="debug-panel">
          {'player  x: 0.00  z: 0.00  yaw: 0.00\nmoving  none\ncamera  x: 0.00  y: 5.50  z: 8.00\ndist    8.00  nearby: none\ndrift   no'}
        </pre>
      )}

      {/* Proximity prompt — content and visibility controlled by useFrame */}
      <div id="prompt" className="prompt-bubble" />

      {/* Overlay — content driven by activeObject data */}
      {activeObject && (
        <div
          className="overlay-backdrop"
          style={{
            opacity: overlayVisible ? 1 : 0,
            transition: `opacity ${OVERLAY_FADE_DURATION}s ease`,
            pointerEvents: overlayVisible ? 'auto' : 'none',
          }}
        >
          <div className="overlay-card">
            <h2 className="overlay-title">{activeObject.title}</h2>
            {activeObject.viewerModel && <ObjectViewer model={activeObject.viewerModel} />}
            {activeObject.overlayImage && (
              <img className="overlay-image" src={activeObject.overlayImage} alt={activeObject.title} />
            )}
            <p className="overlay-description">{activeObject.description}</p>
            <div className="overlay-actions">
              {activeObject.href && (
                <Link className="overlay-link" to={activeObject.href}>
                  {activeObject.linkLabel ?? 'Read more'}
                </Link>
              )}
              <button className="overlay-close-button" onClick={() => setActiveObject(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Canvas camera={{ position: SPAWN_CAM_POS.toArray(), fov: CAM_FOV }} shadows>
        <Suspense fallback={null}>
          <Physics>
            <Scene
              movement={movement}
              nearbyObjectRef={nearbyObjectRef}
              resetRef={playerReset}
              stairActionRef={stairAction}
              transitioningRef={transitioning}
              playAnimationRef={playAnimation}
              animationLockRef={animationLock}
            />
          </Physics>
        </Suspense>
      </Canvas>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GardenView />} />
      </Routes>
    </BrowserRouter>
  )
}
