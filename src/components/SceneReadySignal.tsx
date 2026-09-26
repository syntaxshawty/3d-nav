import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Preload, useProgress } from '@react-three/drei';

// Lives inside the Canvas and calls onReady once the yard is actually ready
// to show — not just downloaded. "Loaded" alone isn't enough: nested
// Suspense boundaries (Backyard.tsx) still need a render to commit, and the
// first frame after that would hitch compiling shaders and uploading
// textures. So once every tracked file is in, it waits a frame for
// everything to mount, mounts <Preload all /> to do that GPU work up front,
// waits a couple more frames, and only then signals.
export function SceneReadySignal({ onReady }: { onReady: () => void }) {
  const { active, loaded, total } = useProgress();
  const allLoaded = !active && total > 0 && loaded === total;
  const [stage, setStage] = useState<'loading' | 'compiling' | 'done'>(
    'loading',
  );
  const framesSinceLoaded = useRef(0);

  useFrame(() => {
    if (stage === 'done' || !allLoaded) return;
    framesSinceLoaded.current += 1;
    if (stage === 'loading') setStage('compiling');
    else if (framesSinceLoaded.current >= 3) {
      setStage('done');
      onReady();
    }
  });

  return stage === 'loading' ? null : <Preload all />;
}
