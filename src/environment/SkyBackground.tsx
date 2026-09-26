import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import type { Fog } from 'three';

// ── Atmosphere constants — tweak to reshape the sky/fog feel ──────────────────
const SKY_COLOR = '#63B8FF'; // flat bright daytime blue — no atmospheric gradient

// Fog color is a pale sky-blue so distant objects blend into the horizon
// instead of fading to a mismatched color.
const FOG_COLOR = '#cfe6f5';
const FOG_NEAR = 22; // fog starts beyond the player's normal wander range — nearby scene stays clear
const FOG_FAR = 55; // fully fogged out by here — just past the pine tree ring, hiding the ground plane's edge

// Focus mode ("standing inside the memory") pulls the same fog in tight
// instead of introducing a second fog — THREE only supports one scene.fog at
// a time, and reusing it means the resting horizon-haze tuning above and the
// focus-mode haze are always the same color/feel, just a different distance.
// Near stays past the interaction radii (~4 units, see interactiveObjects.ts)
// so the focused object itself never fogs, while far is pulled in from 55 to
// 20 so the mid-ground genuinely dissolves instead of just going blurry.
const FOCUS_FOG_NEAR = 5;
const FOCUS_FOG_FAR = 20;

// Per-frame lerp factor at 60fps — see useFollowCamera's CAM_LERP for the
// same frame-rate-independent pattern. Tuned to land in roughly the same
// ~400ms window as the CSS overlay's fade (App.tsx FOCUS_TRANSITION_DURATION)
// so the depth and the color-grade read as one transition, not two.
const FOG_LERP = 0.12;

export function SkyBackground({ fogActive = false }: { fogActive?: boolean }) {
  const fogRef = useRef<Fog>(null!);

  useFrame((_, delta) => {
    const fog = fogRef.current;
    const targetNear = fogActive ? FOCUS_FOG_NEAR : FOG_NEAR;
    const targetFar = fogActive ? FOCUS_FOG_FAR : FOG_FAR;
    const t = Math.min(1, FOG_LERP * delta * 60);
    fog.near += (targetNear - fog.near) * t;
    fog.far += (targetFar - fog.far) * t;
  });

  return (
    <>
      <color attach="background" args={[SKY_COLOR]} />
      <fog ref={fogRef} attach="fog" args={[FOG_COLOR, FOG_NEAR, FOG_FAR]} />
      {/*
        background={false}: only provides reflections/IBL for PBR materials
        (metallic/specular assets render black without this) — doesn't override
        the flat sky color above.

        environmentIntensity: an HDRI carries values well above 1.0, so at full
        strength the sky's specular reflection blew out foliage to white from
        whatever angle happened to face it — worst on the grass and tree leaf
        cards, whose normals point every which way. Dialed back far enough to
        kill the blowout while keeping the diffuse ambient fill, which is doing
        real work on the shed, deck, and fence.
      */}
      <Environment
        preset="park"
        background={false}
        environmentIntensity={0.7}
      />
    </>
  );
}
