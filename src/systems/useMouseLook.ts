import { useEffect, useRef } from 'react'

// Right-mouse-drag (or holding Alt while dragging) adjusts camera pitch —
// vertical look only, clamped. Horizontal aim still comes from the player's
// own yaw (A/D turning); this hook never touches it.
export function useMouseLook(defaultPitch: number, min: number, max: number, sensitivity: number) {
  // A ref, not state — useFrame reads this every frame and must never trigger a re-render.
  const pitch = useRef(defaultPitch)

  useEffect(() => {
    let rightDown = false
    let altDown   = false
    const isLooking = () => rightDown || altDown

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 2) rightDown = true
    }
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 2) rightDown = false
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') altDown = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') altDown = false
    }
    const onMouseMove = (e: MouseEvent) => {
      if (!isLooking()) return
      const next = pitch.current + e.movementY * sensitivity
      pitch.current = Math.min(max, Math.max(min, next))
    }
    // Right-click normally opens the browser context menu — suppress it since
    // right-click here means "look around."
    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    // Losing window focus mid-drag (alt-tab, etc.) shouldn't leave look-mode stuck on.
    const onBlur = () => {
      rightDown = false
      altDown   = false
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('blur', onBlur)
    }
  }, [min, max, sensitivity])

  return pitch
}
