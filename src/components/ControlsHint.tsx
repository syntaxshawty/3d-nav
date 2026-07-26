// One keyboard key: outlined rectangle with a centred label, no fill.
function Key({ x, y, label, size = 34 }: { x: number; y: number; label: string; size?: number }) {
  return (
    <g>
      <rect
        x={x} y={y} width={size} height={size} rx={5}
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth={1.5}
      />
      <text
        x={x + size / 2}
        y={y + size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="rgba(255,255,255,0.75)"
        fontSize={13}
        fontFamily="system-ui, sans-serif"
      >
        {label}
      </text>
    </g>
  )
}

// Line-drawing of WASD + arrow keys side by side.
// Visible until the first movement key press, then fades via CSS transition.
export function ControlsHint({ visible }: { visible: boolean }) {
  const K = 34                // key size in px
  const G = 4                 // gap between keys
  const W = K * 3 + G * 2    // 110 — full width of a 3-wide row
  const H = K * 2 + G        // 72  — two rows + one gap

  return (
    <div
      style={{
        position: 'fixed', bottom: '9%', left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.4s ease',
        pointerEvents: 'none', zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* WASD */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Key x={K + G}           y={0}     label="W" />
          <Key x={0}               y={K + G} label="A" />
          <Key x={K + G}           y={K + G} label="S" />
          <Key x={K * 2 + G * 2}   y={K + G} label="D" />
        </svg>

        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'sans-serif' }}>
          or
        </span>

        {/* Arrow keys */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <Key x={K + G}           y={0}     label="↑" />
          <Key x={0}               y={K + G} label="←" />
          <Key x={K + G}           y={K + G} label="↓" />
          <Key x={K * 2 + G * 2}   y={K + G} label="→" />
        </svg>
      </div>

      <span style={{
        color: 'rgba(255,255,255,0.4)', fontSize: 11,
        fontFamily: 'sans-serif', letterSpacing: '0.06em',
      }}>
        to move
      </span>
    </div>
  )
}
