// Groups the player-owned controls that used to be six separate mutable
// refs (playerReset/stairAction/playAnimation/movementLock/animationLock/
// transitioning) threaded individually through App.tsx -> Scene.tsx ->
// Player -> usePlayerController/useFollowCamera/useProximity/AnimatedCat.
// Same mechanism as before, just grouped under one object: actions are
// no-ops until the hook/component that actually owns that behavior
// assigns its real implementation after mount (same pattern each
// individual function ref used); state fields are read/written directly
// by whichever system owns that flag, same as the individual boolean
// refs did.
export interface PlayerController {
  // Composed by Player (Scene.tsx) from usePlayerController's and
  // useFollowCamera's own reset functions; called by GardenView's reset button.
  reset: () => void;
  // Assigned by usePlayerController; called by GardenView's E-key handler
  // for objects with a scripted stair action.
  useStairs: (direction: 'down' | 'up') => void;
  // Assigned by usePlayerController; called by GardenView's E-key handler
  // when the player is at a yard-facing deck edge (the deck-edge object).
  jumpDown: () => void;
  // Assigned by AnimatedCat; called by GardenView's E-key handler for
  // objects with a one-shot interaction animation.
  playAnimation: (clip: string) => void;
  // Written every frame by usePlayerController (true during the scripted
  // stair transition, a jump, or a one-shot animation); read by useFollowCamera,
  // useProximity, and GardenView's E-key handler.
  transitioning: boolean;
  // Written by AnimatedCat for the duration of a one-shot interaction
  // animation; read by usePlayerController to freeze WASD movement.
  animationLock: boolean;
  // Written by GardenView whenever focus mode (the overlay) is open; read
  // by usePlayerController (freeze movement) and useProximity (hide the
  // prompt) — kept separate from animationLock since the two can be
  // active at once and clear independently.
  movementLock: boolean;
}

export function createPlayerController(): PlayerController {
  return {
    reset: () => {},
    useStairs: () => {},
    jumpDown: () => {},
    playAnimation: () => {},
    transitioning: false,
    animationLock: false,
    movementLock: false,
  };
}
