import { useCallback, useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import './LoadingScreen.css';

// How long loading can go without any progress before the screen offers to
// let the player in anyway — covers a request that hangs rather than fails
// (a hard failure is reported through `failed` instead).
const STALL_TIMEOUT_MS = 30_000;
// Matches .loading-screen's opacity transition in LoadingScreen.css.
const FADE_OUT_MS = 800;

// Full-screen cover shown while the yard's assets load. The Canvas mounts
// behind it immediately, so loading starts on first paint; this only reads
// progress and decides when to let the player in.
export function LoadingScreen({
  ready,
  failed,
  entered,
  onEnter,
}: {
  // From SceneReadySignal: everything loaded, compiled, and rendered.
  ready: boolean;
  // From SceneErrorBoundary: an asset failed and the scene couldn't mount.
  failed: boolean;
  entered: boolean;
  onEnter: () => void;
}) {
  const { progress, loaded, total, errors } = useProgress();
  const [stalled, setStalled] = useState(false);
  const [gone, setGone] = useState(false);

  // useProgress counts files, not bytes, and its total grows as models pull
  // in their own textures — so the raw percentage can stall or even step
  // backwards. The bar only ever moves forward.
  const [shownProgress, setShownProgress] = useState(0);
  if (progress > shownProgress) setShownProgress(progress);

  const hasError = failed || errors.length > 0;
  const canEnter = !hasError && (ready || stalled);

  // Restarts whenever another file finishes (or a new one is discovered), so
  // it only fires after STALL_TIMEOUT_MS with no movement at all.
  useEffect(() => {
    if (ready || hasError) return;
    const timer = setTimeout(() => setStalled(true), STALL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loaded, total, ready, hasError]);

  const enter = useCallback(() => {
    onEnter();
    setTimeout(() => setGone(true), FADE_OUT_MS);
  }, [onEnter]);

  useEffect(() => {
    if (!canEnter || entered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.repeat) enter();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canEnter, entered, enter]);

  if (gone) return null;

  let status;
  if (hasError) {
    status = (
      <p className="loading-message">something didn't load — try refreshing</p>
    );
  } else if (ready) {
    status = <p className="loading-prompt">press enter to explore</p>;
  } else if (stalled) {
    status = (
      <p className="loading-prompt">
        taking a while — press enter to go in anyway
      </p>
    );
  } else {
    status = (
      <div className="loading-bar" role="progressbar" aria-label="loading">
        <div
          className="loading-bar-fill"
          style={{ width: `${shownProgress}%` }}
        />
      </div>
    );
  }

  return (
    <div
      className={`loading-screen${entered ? ' loading-screen--leaving' : ''}`}
      onClick={canEnter && !entered ? enter : undefined}
    >
      <h1 className="loading-title">welcome to beaches yard</h1>
      <div className="loading-status">{status}</div>
    </div>
  );
}
