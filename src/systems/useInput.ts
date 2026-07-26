import { useEffect, useRef } from 'react'

export interface Movement {
  forward:  boolean
  backward: boolean
  left:     boolean
  right:    boolean
}

export function useInput() {
  // A ref, not state — changes here must never trigger re-renders.
  // useFrame reads this on every animation frame directly.
  const movement = useRef<Movement>({
    forward:  false,
    backward: false,
    left:     false,
    right:    false,
  })

  useEffect(() => {
    // Arrow keys scroll the page by default — prevent that when used for movement.
    const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

    const down = (e: KeyboardEvent) => {
      if (ARROW_KEYS.has(e.key)) e.preventDefault()

      // Arrow keys and WASD both write to the same movement ref.
      // The Player's useFrame reads movement.current and doesn't care which
      // physical key set it — no duplication in the movement logic.
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')    movement.current.forward  = true
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown')  movement.current.backward = true
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')  movement.current.left     = true
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') movement.current.right    = true
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp')    movement.current.forward  = false
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown')  movement.current.backward = false
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft')  movement.current.left     = false
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') movement.current.right    = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup',   up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup',   up)
    }
  }, [])

  // FUTURE MOBILE JOYSTICK: write to movement.current here instead of (or in
  // addition to) the keyboard handler above. For example:
  //   movement.current.forward  = joystick.y < -0.2
  //   movement.current.backward = joystick.y >  0.2
  //   movement.current.left     = joystick.x < -0.2
  //   movement.current.right    = joystick.x >  0.2
  // The Player component's useFrame loop reads movement.current and doesn't
  // care whether a keyboard or a joystick wrote to it.

  return movement
}
