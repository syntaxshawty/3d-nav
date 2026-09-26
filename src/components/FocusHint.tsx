import { Key } from './ControlsHint';

// Single-key hint shown while focus mode is open, styled to match
// ControlsHint's WASD glyphs so the two hints read as one visual language.
// Fades with the same visible/opacity pattern — driven by the caller so it
// stays in lockstep with the fog and content fade.
export function FocusHint({ visible }: { visible: boolean }) {
  const K = 34;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '7%',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease',
        pointerEvents: 'none',
        zIndex: 210,
      }}
    >
      <svg width={K} height={K + 6} viewBox={`0 0 ${K} ${K + 6}`}>
        <Key x={0} y={0} label="Esc" size={K} />
      </svg>
      <span
        style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 11,
          fontFamily: 'sans-serif',
          letterSpacing: '0.06em',
        }}
      >
        to close
      </span>
    </div>
  );
}
