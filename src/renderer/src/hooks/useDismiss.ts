import { useEffect, useRef, type RefObject } from 'react'

export function useDismiss(ref: RefObject<HTMLElement | null>, onDismiss: () => void): void {
  const dismissRef = useRef(onDismiss)
  dismissRef.current = onDismiss

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissRef.current()
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) dismissRef.current()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer, true)
    }
  }, [ref])
}
