import { useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  BufferAttribute, Color, Object3D,
  type BufferGeometry, type InstancedMesh, type Matrix4, type Mesh,
  type MeshStandardMaterial,
} from 'three'
import { hash } from '../mathUtils'
import { isInsideDeckFootprint, STAIR_TOP_POSITION, STAIR_BASE_POSITION } from '../data/deckGeometry'

// Derived artifact. The master is "3d nav assets/grass_01_clean.glb" (3.25 MB,
// 2000x4080 PNG); this is its optimized build at 104 KB. Regenerate with:
//
//   npx @gltf-transform/cli optimize <master> <this> \
//     --compress quantize --texture-compress webp --texture-size 1024 --simplify false
//
// quantize rather than the default meshopt: meshopt and draco both need a
// runtime decoder, quantization doesn't. --simplify false because the blades are
// thin alpha cards totalling ~600 verts — nothing to win, silhouette to lose.
const GRASS_URL = '/models/grass_01_clean.glb'

// ── Grass scatter config — everything about coverage, sizing, and where
// grass is/isn't allowed lives here. ─────────────────────────────────────────
const GRASS_CONFIG = {
  // Candidates generated, not a guaranteed final count — instances landing
  // inside an exclusion zone are simply skipped (see isExcluded below), so
  // the actual number rendered is somewhat lower than this.
  instanceCount: 1750,

  // The clump is authored at 3.84 x 4.27 x 3.40 world units, so this scales it
  // to roughly 1.7 units — unmown weeds rather than lawn, which is the look,
  // but tall enough relative to the camera to need the dissolve below.
  baseScale: 0.4,
  scaleVariationFrac: 0.3,   // +/- fraction of baseScale, applied per instance

  // Matches Backyard.tsx's yard rectangle (fence runs along X=-8/X=30, Z=-28/Z=0).
  yardBounds: { minX: -8, maxX: 30, minZ: -28, maxZ: 0 },

  // Generous circular keep-outs around single-point props (tree trunks, the
  // shed, the stairs). Radii are approximate footprints with a little pad,
  // not exact geometry — precision doesn't matter for background ground cover.
  exclusionCircles: [
    { x: -6,   z: -15,   radius: 1.5 },  // plum-tree trunk
    { x: 10,   z: -26,   radius: 1.5 },  // yard-tree trunk
    { x: -4.5, z: -22.5, radius: 4 },    // garden-shed footprint
    {
      // Stairs run between the deck and the yard — isInsideDeckFootprint
      // (below) only covers the deck surface itself, not the stair treads,
      // so this pads out the descent path separately.
      x: (STAIR_TOP_POSITION[0] + STAIR_BASE_POSITION[0]) / 2,
      z: (STAIR_TOP_POSITION[2] + STAIR_BASE_POSITION[2]) / 2,
      radius: 3,
    },
  ],

  // Rectangular keep-outs for elongated props, in world X/Z.
  exclusionRects: [
    { x0: -5,   z0: -29,   x1: 22.5, z1: -24.5 },  // planter-box run along the rear fence
    { x0: 21.5, z0: -27.5, x1: 30.5, z1: -12.5 },  // brick bed (back-right corner)
    { x0: 23,   z0: -37,   x1: 47,   z1: -22 },    // blackberry bramble cluster
  ],
}

// Per-instance multipliers against the base texture, not absolute colors. The
// blades are a saturated green that fights the straw-colored ground, so the dry
// end lifts red and drops blue. Values above 1 brighten deliberately: a multiply
// can only walk green toward olive, never toward straw, so reaching dry needs
// gain. A genuinely golden lawn would want the textures recolored instead.
const TINT_LUSH = new Color(0.80, 0.95, 0.75)
const TINT_DRY  = new Color(1.60, 1.20, 0.55)

// Dryness is sampled per patch of yard rather than per clump, so the lawn dries
// in uneven swathes instead of salt-and-pepper noise. Size is in world units;
// the weight leaves each clump private jitter so patch edges don't read as tiles.
const DRYNESS_PATCH_SIZE   = 6
const DRYNESS_PATCH_WEIGHT = 0.75

function isExcluded(x: number, z: number): boolean {
  // Covers the deck's own surface, its arms, and the house-wall edge (the
  // deck is what's flush against the house — there's no separate house
  // model to exclude against).
  if (isInsideDeckFootprint(x, z)) return true
  for (const c of GRASS_CONFIG.exclusionCircles) {
    const dx = x - c.x, dz = z - c.z
    if (dx * dx + dz * dz <= c.radius * c.radius) return true
  }
  for (const r of GRASS_CONFIG.exclusionRects) {
    if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return true
  }
  return false
}

// Deterministic scatter — same layout every load, computed once at module scope
// since it depends on nothing but the config above. Transforms and colors are
// built in one pass so index i means the same clump in both.
const { INSTANCE_TRANSFORMS, INSTANCE_COLORS } = (() => {
  const { minX, maxX, minZ, maxZ } = GRASS_CONFIG.yardBounds
  const dummy      = new Object3D()
  const transforms: Matrix4[] = []
  const colors:     Color[]   = []

  for (let i = 0; i < GRASS_CONFIG.instanceCount; i++) {
    const x = minX + hash(i, 11) * (maxX - minX)
    const z = minZ + hash(i, 23) * (maxZ - minZ)
    if (isExcluded(x, z)) continue

    const rotY        = hash(i, 37) * Math.PI * 2
    const scaleJitter = 1 + (hash(i, 41) * 2 - 1) * GRASS_CONFIG.scaleVariationFrac

    dummy.position.set(x, 0, z)
    dummy.rotation.set(0, rotY, 0)
    dummy.scale.setScalar(GRASS_CONFIG.baseScale * scaleJitter)
    dummy.updateMatrix()
    transforms.push(dummy.matrix.clone())

    // Snapping position to a patch grid makes neighbouring clumps draw the same
    // patch sample, so they dry out together.
    const patchKey = Math.floor(x / DRYNESS_PATCH_SIZE) * 73 + Math.floor(z / DRYNESS_PATCH_SIZE)
    const dryness  = hash(patchKey, 53) * DRYNESS_PATCH_WEIGHT
                   + hash(i, 59) * (1 - DRYNESS_PATCH_WEIGHT)
    const shade    = 0.85 + hash(i, 61) * 0.3
    colors.push(new Color().lerpColors(TINT_LUSH, TINT_DRY, dryness).multiplyScalar(shade))
  }

  return { INSTANCE_TRANSFORMS: transforms, INSTANCE_COLORS: colors }
})()

// The grass stands taller than the camera, so clumps between it and the cat
// become a wall. Each clump dissolves as it approaches instead. Done in the
// shader rather than by rescaling instances on the CPU, which at this count
// would mean re-uploading the whole instanceMatrix buffer every frame.
//
// Distance is measured on the ground plane: what makes a clump an occluder is
// sitting near the lens horizontally, not its height below it.
const CAMERA_FADE_NEAR = 0.5   // fully dissolved at or below this XZ distance
const CAMERA_FADE_FAR  = 1.7   // fully solid at or beyond it

// three multiplies instanceColor into vColor in the vertex stage, but
// color_pars_fragment/color_fragment only declare and read vColor under
// USE_COLOR — so both halves have to be re-added here or the tint is computed
// and silently dropped. Setting material.vertexColors would define USE_COLOR
// and fix the fragment side, but it also makes the vertex shader read a `color`
// attribute the merged geometry lacks; that resolves to (0,0,0) and renders
// every blade black.
const TINT_GUARD = '#if defined( USE_INSTANCING_COLOR ) && !defined( USE_COLOR ) && !defined( USE_COLOR_ALPHA )'

// KHR_mesh_quantization stores positions as normalized int16 and leaves the
// node's scale to restore world size. BufferGeometry.applyMatrix4 round-trips
// every vertex through denormalize -> transform -> renormalize, and anything
// landing outside [-1, 1] renormalizes past 32767 — where TypedArray assignment
// *wraps* rather than clamping. The node scale alone is 2.13, so a blade tip at
// y=3.70 returns as y=-0.30 and the clump is shredded, silently.
//
// Normals are deliberately left quantized: applyNormalMatrix re-normalizes them
// to unit length, so they always land back inside int8 range.
function dequantizePositions(geometry: BufferGeometry): BufferGeometry {
  const position = geometry.getAttribute('position')
  if (position.array instanceof Float32Array) return geometry

  const unpacked = new Float32Array(position.count * position.itemSize)
  for (let i = 0; i < position.count; i++) {
    // getX/getY/getZ denormalize on the way out when `normalized` is set.
    unpacked[i * 3 + 0] = position.getX(i)
    unpacked[i * 3 + 1] = position.getY(i)
    unpacked[i * 3 + 2] = position.getZ(i)
  }
  geometry.setAttribute('position', new BufferAttribute(unpacked, position.itemSize))
  return geometry
}

// The GLB authors every card as alphaMode BLEND, which GLTFLoader turns into
// transparent + depthWrite:false — blades then never occlude each other, and
// instances within an InstancedMesh are never depth-sorted. The alpha is
// effectively binary (~91% clear, ~9% opaque), so a cutout is both truer to the
// art and cheaper: it restores depth writes and lets early-z do its job.
//
// roughness 0.5 as authored is glossy enough to give the sky HDRI a tight
// specular lobe to reflect, which turned cards facing it white. Foliage is
// near-Lambertian anyway.
//
// Cloned rather than mutated: the source belongs to useGLTF's module-level
// cache, shared with anything else loading this URL.
function toGrassMaterial(source: MeshStandardMaterial): MeshStandardMaterial {
  const material = source.clone()
  material.alphaTest   = 0.5
  material.transparent = false
  material.depthWrite  = true
  material.roughness   = 1

  // All four materials share this function body, so their sources stringify
  // identically — three derives its default program cache key from
  // onBeforeCompile.toString(), letting them share one compiled program.
  material.onBeforeCompile = shader => {
    shader.uniforms.uFadeNear = { value: CAMERA_FADE_NEAR }
    shader.uniforms.uFadeFar  = { value: CAMERA_FADE_FAR }

    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', /* glsl */`
        #include <common>
        varying float vGrassFade;
        uniform float uFadeNear;
        uniform float uFadeFar;
      `)
      .replace('#include <begin_vertex>', /* glsl */`
        #include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 grassOrigin = ( modelMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz;
          vGrassFade = smoothstep( uFadeNear, uFadeFar, length( grassOrigin.xz - cameraPosition.xz ) );
        #else
          vGrassFade = 1.0;
        #endif
      `)

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */`
        #include <common>
        varying float vGrassFade;

        // 4x4 ordered Bayer threshold, derived arithmetically from the
        // recursive definition so it needs no array indexing. Returns
        // (1..16)/16 so a fade of 0 discards every pixel and a fade of 1
        // discards none — an inclusive 0..15 would leak 1 pixel in 16.
        float grassDither( vec2 c ) {
          vec2 p  = mod( floor( c ), 4.0 );
          vec2 lo = mod( p, 2.0 );
          vec2 hi = floor( p * 0.5 );
          float v = 4.0 * ( 2.0 * lo.x + 3.0 * lo.y - 4.0 * lo.x * lo.y )
                        + ( 2.0 * hi.x + 3.0 * hi.y - 4.0 * hi.x * hi.y );
          return ( v + 1.0 ) / 16.0;
        }
      `)
      .replace('#include <color_pars_fragment>', /* glsl */`
        #include <color_pars_fragment>
        ${TINT_GUARD}
          varying vec4 vColor;
        #endif
      `)
      // Discarding here, right after the clipping-plane test, keeps dissolved
      // fragments from reaching the alpha test or any lighting.
      .replace('#include <clipping_planes_fragment>', /* glsl */`
        #include <clipping_planes_fragment>
        if ( vGrassFade < grassDither( gl_FragCoord.xy ) ) discard;
      `)
      .replace('#include <color_fragment>', /* glsl */`
        #include <color_fragment>
        ${TINT_GUARD}
          diffuseColor.rgb *= vColor.rgb;
        #endif
      `)
  }

  return material
}

// One InstancedMesh per merged (geometry, material) group — written once in a
// layout effect, never touched per frame (the dissolve is entirely shader-side).
function InstancedGrassGroup({ geometry, material }: { geometry: BufferGeometry; material: MeshStandardMaterial }) {
  const meshRef = useRef<InstancedMesh>(null!)

  useLayoutEffect(() => {
    const mesh = meshRef.current
    INSTANCE_TRANSFORMS.forEach((m, i) => mesh.setMatrixAt(i, m))
    // Allocates mesh.instanceColor, which is what makes the renderer define
    // USE_INSTANCING_COLOR and light up the tint path above.
    INSTANCE_COLORS.forEach((c, i) => mesh.setColorAt(i, c))
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, INSTANCE_TRANSFORMS.length]}
      // Frustum culling tests the base geometry's bounding sphere, which sits
      // around the origin clump and knows nothing about instances scattered
      // across the yard — leaving it on culls the whole field at view edges.
      frustumCulled={false}
    />
  )
}

// Scattered instanced grass clumps across the yard, sitting on top of Ground's
// textured base layer. No wind, physics, colliders, or shadows — purely visual.
export function Grass() {
  const { scene } = useGLTF(GRASS_URL)

  // The clump is one mesh of four alpha-carded primitives, one material each.
  // Grouping and merging by material lets each become a single InstancedMesh —
  // one draw call per material regardless of instance count — instead of
  // cloning the whole thing per instance.
  const groups = useMemo(() => {
    scene.updateMatrixWorld(true)
    const byMaterial = new Map<string, { material: MeshStandardMaterial; geometries: BufferGeometry[] }>()

    scene.traverse(obj => {
      const mesh = obj as Mesh
      if (!mesh.isMesh) return
      const material = mesh.material as MeshStandardMaterial
      // Only instance textured cards. Guards against a re-export reintroducing
      // an untextured authoring plane, which GLTFLoader would hand the default
      // white metalness-1 material.
      if (!material.map) return

      const entry = byMaterial.get(material.uuid) ?? { material: toGrassMaterial(material), geometries: [] }
      // Each primitive's transform (its card's place within the clump) has to be
      // baked in before merging, or every card collapses onto the same origin.
      // Positions must leave quantized form first — see dequantizePositions.
      const geometry = dequantizePositions(mesh.geometry.clone())
      geometry.applyMatrix4(mesh.matrixWorld)
      entry.geometries.push(geometry)
      byMaterial.set(material.uuid, entry)
    })

    return Array.from(byMaterial.values()).map(({ material, geometries }) => ({
      material,
      geometry: mergeGeometries(geometries, false) as BufferGeometry,
    }))
  }, [scene])

  return (
    <>
      {groups.map(({ geometry, material }) => (
        <InstancedGrassGroup key={material.uuid} geometry={geometry} material={material} />
      ))}
    </>
  )
}

useGLTF.preload(GRASS_URL)
