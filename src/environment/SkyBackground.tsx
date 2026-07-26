import { Environment } from '@react-three/drei'

// ── Atmosphere constants — tweak to reshape the sky/fog feel ──────────────────
const SKY_COLOR = '#63B8FF'   // flat bright daytime blue — no atmospheric gradient

// Fog color is a pale sky-blue so distant objects blend into the horizon
// instead of fading to a mismatched color.
const FOG_COLOR = '#cfe6f5'
const FOG_NEAR  = 22   // fog starts beyond the player's normal wander range — nearby scene stays clear
const FOG_FAR   = 55   // fully fogged out by here — just past the pine tree ring, hiding the ground plane's edge

export function SkyBackground() {
  return (
    <>
      <color attach="background" args={[SKY_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />
      {/* background={false}: only provides reflections/IBL for PBR materials (metallic/specular assets render black without this) — doesn't override the flat sky color above */}
      <Environment preset="park" background={false} />
    </>
  )
}
