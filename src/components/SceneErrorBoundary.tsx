import { Component, type ReactNode } from 'react';

// Wraps the Canvas so a failed asset load (useGLTF/useTexture/useEnvironment
// throw on a network error, and R3F rethrows that out of <Canvas>) reports to
// the loading screen instead of unmounting the whole app to a blank page.
export class SceneErrorBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
