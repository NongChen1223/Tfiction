import { useEffect } from 'react'

export function useClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  enabled: boolean,
  onOutsideClick: () => void
) {
  useEffect(() => {
    if (!enabled) {
      return
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!ref.current || !target || ref.current.contains(target)) {
        return
      }

      onOutsideClick()
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [enabled, onOutsideClick, ref])
}
