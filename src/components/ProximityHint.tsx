import { Key } from './ControlsHint'

// Single-key hint shown when the player is within range of an interactive
// object, styled to match ControlsHint/FocusHint's key-glyph look so all
// three hints read as one visual language. Content and visibility are
// toggled by direct DOM writes from useProximity.ts (no React re-render) —
// see the #prompt-caption span below, and .style.opacity on the container.
// Opacity (not display) so pressing Enter fades this out instead of it
// popping off abruptly and lingering visible through the focus-mode fog
// alongside FocusHint's Esc key.
const KEY_H = 34
const KEY_W = 58 // wider than a single-letter key — "Enter" needs the room

export function ProximityHint() {
  return (
    <div
      id="prompt"
      style={{
        position: 'fixed', bottom: '10%', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        opacity: 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none', zIndex: 50,
      }}
    >
      <svg width={KEY_W} height={KEY_H + 6} viewBox={`0 0 ${KEY_W} ${KEY_H + 6}`}>
        <Key x={0} y={0} label="Enter" size={KEY_H} width={KEY_W} />
      </svg>
      <span id="prompt-caption" style={{
        color: 'rgba(255,255,255,0.4)', fontSize: 11,
        fontFamily: 'sans-serif', letterSpacing: '0.06em',
      }}>
        to inspect
      </span>
    </div>
  )
}
