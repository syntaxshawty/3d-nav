import { useState, useEffect, useRef, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useInput } from './systems/useInput'
import FirstGardenObjectPage from './pages/FirstGardenObject'
import { type InteractiveObjectData } from './data/interactiveObjects'
import { ObjectViewer } from './components/ObjectViewer'
import { ControlsHint } from './components/ControlsHint'
import { Scene } from './Scene'
import { SPAWN_CAM_POS } from './data/spawn'

// ── Scale / child's-eye-view tuning ─────────────────────────────────────────
const CAM_FOV = 58   // narrower than a fisheye-wide FOV — keeps the world from feeling flat/distant

// The walking scene: owns all state, renders HTML layer + Canvas
function GardenView() {
  const movement       = useInput()
  const nearbyObjectRef = useRef<InteractiveObjectData | null>(null)
  const playerReset     = useRef<() => void>(() => {})
  const stairAction     = useRef<(direction: 'down' | 'up') => void>(() => {})
  const transitioning   = useRef(false)

  const [activeObject, setActiveObject] = useState<InteractiveObjectData | null>(null)
  // showHint starts true; set to false the first time any movement key is pressed.
  const [showHint, setShowHint] = useState(true)

  // Interaction on E: objects with a scripted `action` (the stair trigger
  // points) play that instead of opening the info overlay. Blocked while a
  // transition is already playing, so it can't be restarted mid-animation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'e' && e.key !== 'E') || !nearbyObjectRef.current || activeObject || transitioning.current) return
      const obj = nearbyObjectRef.current
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
      <button
        onClick={() => playerReset.current()}
        style={{
          position: 'fixed', top: 12, right: 12,
          background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(255,255,255,0.18)', borderRadius: '6px',
          padding: '6px 14px', cursor: 'pointer',
          fontFamily: 'sans-serif', fontSize: '13px',
          zIndex: 100,
        }}
      >
        take me home
      </button>

      {/* Debug overlay — dev-only */}
      {import.meta.env.DEV && (
        <pre
          id="debug"
          style={{
            position: 'fixed', top: 12, left: 12, margin: 0,
            padding: '8px 14px', background: 'rgba(0,0,0,0.65)', color: '#00ff88',
            fontFamily: 'monospace', fontSize: 14, lineHeight: 1.7, borderRadius: 6,
            pointerEvents: 'none', zIndex: 100, whiteSpace: 'pre',
          }}
        >
          {'player  x: 0.00  z: 0.00  yaw: 0.00\nmoving  none\ncamera  x: 0.00  y: 5.50  z: 8.00\ndist    8.00  nearby: none\ndrift   no'}
        </pre>
      )}

      {/* Proximity prompt — content and visibility controlled by useFrame */}
      <div
        id="prompt"
        style={{
          display: 'none', position: 'fixed', bottom: '28%',
          left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)', color: 'white',
          padding: '8px 18px', borderRadius: '6px',
          fontFamily: 'sans-serif', fontSize: '14px',
          letterSpacing: '0.03em', pointerEvents: 'none',
          zIndex: 50, whiteSpace: 'nowrap',
        }}
      />

      {/* Overlay — content driven by activeObject data */}
      {activeObject && (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)', zIndex: 200,
        }}>
          <div style={{
            background: 'rgba(10,10,20,0.88)', color: 'white',
            padding: '2rem 2.5rem', borderRadius: '12px',
            maxWidth: '400px', width: '90%', textAlign: 'center',
            fontFamily: 'sans-serif', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.3rem', fontWeight: 500 }}>
              {activeObject.title}
            </h2>
            {activeObject.viewerModel && <ObjectViewer model={activeObject.viewerModel} />}
            <p style={{ margin: '0 0 1.5rem', color: '#aaa', lineHeight: 1.6, fontSize: '0.95rem' }}>
              {activeObject.description}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {activeObject.href && (
                <Link
                  to={activeObject.href}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.12)', color: 'white',
                    border: '1px solid rgba(255,255,255,0.25)',
                    textDecoration: 'none', fontSize: '0.9rem',
                  }}
                >
                  {activeObject.linkLabel ?? 'Read more'}
                </Link>
              )}
              <button
                onClick={() => setActiveObject(null)}
                style={{
                  padding: '0.5rem 1.25rem', background: 'white',
                  color: '#111', border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.9rem',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Canvas camera={{ position: SPAWN_CAM_POS.toArray(), fov: CAM_FOV }}>
        <Suspense fallback={null}>
          <Physics>
            <Scene
              movement={movement}
              nearbyObjectRef={nearbyObjectRef}
              resetRef={playerReset}
              stairActionRef={stairAction}
              transitioningRef={transitioning}
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
        <Route path="/"                              element={<GardenView />} />
        <Route path="/projects/first-garden-object" element={<FirstGardenObjectPage />} />
      </Routes>
    </BrowserRouter>
  )
}
