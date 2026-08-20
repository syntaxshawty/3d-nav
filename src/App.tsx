import { useState, useEffect, useRef, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useInput } from './systems/useInput'
import { createPlayerController } from './systems/playerController'
import { type InteractiveObjectData, type InteractiveContentObject } from './data/interactiveObjects'
import { CONTENT_FADE_DURATION } from './data/focusTiming'
import { ControlsHint } from './components/ControlsHint'
import { FocusHint } from './components/FocusHint'
import { ProximityHint } from './components/ProximityHint'
import { Scene } from './Scene'
import { SPAWN_CAM_POS } from './data/spawn'

// ── Scale / child's-eye-view tuning ─────────────────────────────────────────
const CAM_FOV = 58   // narrower than a fisheye-wide FOV — keeps the world from feeling flat/distant

// ── Focus mode pacing ─────────────────────────────────────────────────────
// Two-stage reveal: the fog (scene fog + canvas blur + fog gradient) rolls in
// first, on its own, so the world visibly recedes before any text shows up —
// then the title/description/image fade in on top of it. Closing reverses
// the order (content out, then fog out) rather than just running the same
// timeline backwards.
const FOG_FADE_DURATION      = 2.5  // seconds — how long the fog itself takes to fade in/out
const CONTENT_FADE_DURATION  = .5   // seconds — content's own fade + slide, once the fog has arrived
// Scene desaturates/softens to feel like it's receding into memory, without
// losing the environment entirely — it stays visible (and interactive)
// behind the fog.
const FOCUS_SCENE_FILTER = 'blur(4px) saturate(0.4) brightness(0.75)'

// The walking scene: owns all state, renders HTML layer + Canvas
function GardenView() {
  const movement       = useInput()
  const nearbyObjectRef = useRef<InteractiveObjectData | null>(null)
  // Groups every player-owned control (reset/useStairs/playAnimation
  // actions, transitioning/animationLock/movementLock state) behind one
  // ref instead of six separate ones — see playerController.ts.
  // movementLock specifically freezes WASD movement/turning for as long as
  // focus mode is open — set the instant E/Enter is pressed (not waiting
  // on the fog/content fade), so there's no window where the player can
  // wander off mid-interaction, and cleared the instant it closes so
  // control comes back immediately rather than waiting out the closing fade.
  const playerRef = useRef(createPlayerController())

  // Only ever holds a content object — action triggers (e.g. the stairs)
  // short-circuit in the E-key handler below before setActiveObject is
  // ever called, so this is narrower than nearbyObjectRef's type on purpose.
  const [activeObject, setActiveObject] = useState<InteractiveContentObject | null>(null)
  // Drives the fog (scene fog + canvas blur + fog gradient) — the first
  // stage of the reveal, kept separate from activeObject so it can fade in
  // after a short delay instead of popping in the instant E is pressed.
  const [fogVisible, setFogVisible] = useState(false)
  // Drives the title/description/image fade + slide — the second stage,
  // only turned on once the fog has finished arriving.
  const [contentVisible, setContentVisible] = useState(false)
  // The object actually rendered by focus mode — stays populated until both
  // stages have finished fading out, so closing has something to animate
  // instead of the content vanishing instantly.
  const [focusObject, setFocusObject] = useState<InteractiveContentObject | null>(null)
  // showHint starts true; set to false the first time any movement key is pressed.
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    playerRef.current.movementLock = !!activeObject
  }, [activeObject])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    if (activeObject) {
      setFocusObject(activeObject)
      // Stage 1: fog rolls in on its own...
      timers.push(setTimeout(() => {
        setFogVisible(true)
        // ...stage 2: content follows once the fog has arrived.
        timers.push(setTimeout(() => setContentVisible(true), FOG_FADE_DURATION * 1000))
      }))
    } else {
      // Closing reverses the order: content fades out first...
      setContentVisible(false)
      timers.push(setTimeout(() => {
        setFogVisible(false)
        // ...then the fog, then the object itself unmounts.
        timers.push(setTimeout(() => setFocusObject(null), FOG_FADE_DURATION * 1000))
      }, CONTENT_FADE_DURATION * 1000))
    }

    return () => timers.forEach(clearTimeout)
  }, [activeObject])

  // Interaction on E: objects with a scripted `action` (the stair trigger
  // points) play that instead of opening focus mode. Blocked while a
  // transition is already playing, so it can't be restarted mid-animation.
  // Escape closes focus mode from anywhere while it's open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeObject) {
        setActiveObject(null)
        return
      }
      if ((e.key !== 'Enter' && e.key !== 'enter') || !nearbyObjectRef.current || activeObject || playerRef.current.transitioning) return
      const obj = nearbyObjectRef.current
      if (obj.animation) playerRef.current.playAnimation(obj.animation)
      // Explicit === undefined check (not a bare `else`) so TypeScript can
      // actually narrow obj to InteractiveContentObject here — excluding
      // both action literals via a bare else doesn't propagate through a
      // discriminated union the same way a positive check on each does.
      if (obj.action === 'descend-stairs')       playerRef.current.useStairs('down')
      else if (obj.action === 'ascend-stairs')   playerRef.current.useStairs('up')
      else if (obj.action === undefined)         setActiveObject(obj)
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

      {/* Reset button — always visible, top-right corner. Non-focusable
          (tabIndex -1) so it can't retain keyboard focus after a click —
          otherwise a focused button intercepts the next Enter keypress as a
          native click, resetting position instead of opening focus mode. */}
      <button className="reset-button" tabIndex={-1} onClick={() => playerRef.current.reset()}>
        take me home
      </button>

      {/* Debug overlay — dev-only */}
      {import.meta.env.DEV && (
        <pre id="debug" className="debug-panel">
          {'player  x: 0.00  z: 0.00  yaw: 0.00\nmoving  none\ncamera  x: 0.00  y: 5.50  z: 8.00\ndist    8.00  nearby: none\ndrift   no'}
        </pre>
      )}

      {/* Proximity prompt — content and visibility controlled by useFrame */}
      <ProximityHint />

      {/* Fog — sits between the (blurred) scene and the floating content,
          giving the "receding into memory" haze its own layer to fade in on. */}
      {focusObject && (
        <div
          className="focus-fog"
          style={{
            opacity: fogVisible ? 1 : 0,
            transition: `opacity ${FOG_FADE_DURATION}s ease`,
          }}
        />
      )}

      {/* Focus mode — content driven by focusObject data, no card/panel/border.
          The world stays visible and interactive behind it. Fades in only
          after the fog above has finished arriving (see the effect above). */}
      {focusObject && (
        <div className="focus-content">
          <div
            className="focus-layout"
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateX(6%) translateY(0)' : 'translateX(6%) translateY(14px)',
              transition: `opacity ${CONTENT_FADE_DURATION}s ease, transform ${CONTENT_FADE_DURATION}s ease`,
            }}
          >
            <div className="focus-text">
              <h2 className="focus-title">{focusObject.title}</h2>
              <hr className="focus-divider" />
              <p className="focus-description">{focusObject.description}</p>
              {focusObject.href && (
                <Link
                  className="focus-link"
                  to={focusObject.href}
                  style={{ pointerEvents: contentVisible ? 'auto' : 'none' }}
                >
                  {focusObject.linkLabel ?? 'Read more'}
                </Link>
              )}
            </div>
            {focusObject.viewerModel && (
              <div className="focus-image-wrap">
                <ObjectViewer model={focusObject.viewerModel} />
              </div>
            )}
            {focusObject.overlayImage && (
              <div className="focus-image-wrap">
                <img className="focus-image" src={focusObject.overlayImage} alt={focusObject.title} />
                {focusObject.overlayImageGallery && (
                  <div className="focus-image-gallery">
                    {focusObject.overlayImageGallery.map(src => (
                      <img key={src} className="focus-image-gallery-item" src={src} alt={focusObject.title} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <FocusHint visible={contentVisible} />

      <div
        className="scene-container"
        style={{
          filter: fogVisible ? FOCUS_SCENE_FILTER : 'none',
          transition: `filter ${FOG_FADE_DURATION}s ease`,
        }}
      >
        <Canvas camera={{ position: SPAWN_CAM_POS.toArray(), fov: CAM_FOV }} shadows>
          <Suspense fallback={null}>
            <Physics>
              <Scene
                movement={movement}
                nearbyObjectRef={nearbyObjectRef}
                playerRef={playerRef}
                fogActive={fogVisible}
              />
            </Physics>
          </Suspense>
        </Canvas>
      </div>
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
