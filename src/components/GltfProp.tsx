import { useGLTF, Clone } from '@react-three/drei'

// Generic loader for a single real-asset GLB, placed anywhere in the scene.
// Clone (not <primitive object={scene}/>) so the same cached GLTF can be
// reused for multiple instances — required for things like fence posts that
// repeat the same file many times.
export function GltfProp({
  url, position, rotation, scale,
}: {
  url: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
}) {
  const { scene } = useGLTF(url)
  return <Clone object={scene} position={position} rotation={rotation} scale={scale} />
}

// Kick off loading as soon as the module runs, instead of waiting for first render.
useGLTF.preload('/models/plum_tree.glb')
useGLTF.preload('/models/yard_tree.glb')
useGLTF.preload('/models/blackberry_01.glb')
useGLTF.preload('/models/blackberry_02.glb')
useGLTF.preload('/models/blackberry_03.glb')
useGLTF.preload('/models/strawberry.glb')
useGLTF.preload('/models/deck_chair.glb')
useGLTF.preload('/models/strawberry_pot.glb')
useGLTF.preload('/models/garden_shed.glb')
useGLTF.preload('/models/planter_box_single.glb')
useGLTF.preload('/models/brick_bed.glb')
useGLTF.preload('/models/nasturtium.glb')
useGLTF.preload('/models/fence/left.glb')
useGLTF.preload('/models/fence/rear.glb')
useGLTF.preload('/models/fence/right.glb')
