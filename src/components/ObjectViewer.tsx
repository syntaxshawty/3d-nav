import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, useGLTF, Clone } from '@react-three/drei'

// A small, self-contained "product viewer" — its own Canvas/scene, separate
// from the main game world, so dragging to spin it can never affect the
// player or the main camera. Used inside the interaction overlay.

const VIEWER_SIZE = 260   // px, both width and height
// strawberry.glb's bounding box is roughly 5×7×5 units, centered around
// y≈3.5 (not the origin) — target/position account for that so the whole
// model fits in frame with margin instead of being cropped at the edges.
const TARGET: [number, number, number] = [0, 3.2, 0]
const CAMERA_POSITION: [number, number, number] = [0, 5.5, 11]
const AUTO_ROTATE_SPEED = 2.2

function ViewerModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <Clone object={scene} />
}

export function ObjectViewer({ model }: { model: string }) {
  return (
    <div
      style={{
        width: VIEWER_SIZE, height: VIEWER_SIZE, margin: '0 auto 1rem',
        borderRadius: '10px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'radial-gradient(circle at 50% 40%, #2a2a35, #16161d)',
      }}
    >
      <Canvas camera={{ position: CAMERA_POSITION, fov: 40 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[4, 6, 4]} intensity={1.2} />
        <directionalLight position={[-4, -2, -4]} intensity={0.3} />
        <Suspense fallback={null}>
          <ViewerModel url={model} />
        </Suspense>
        <OrbitControls
          target={TARGET}
          enablePan={false}
          enableZoom={true}
          minDistance={7}
          maxDistance={20}
          autoRotate
          autoRotateSpeed={AUTO_ROTATE_SPEED}
        />
      </Canvas>
    </div>
  )
}
