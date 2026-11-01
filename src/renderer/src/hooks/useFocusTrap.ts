import { useEffect, useRef, type RefObject } from 'react'
import { FOCUSABLE_SELECTOR } from '../constants/focusable'
import { isTopModal, pushModal, removeModal } from '../utils/modalStack'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, onEscape: () => void): void {
  const escapeRef = useRef(onEscape)
  escapeRef.current = onEscape

  useEffect(() => {
    const token = Symbol('modal')
    const previous = document.activeElement as HTMLElement | null
    pushModal(token)
    const root = ref.current
    const focusables = () => Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [])
    ;(focusables()[0] ?? root)?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (!isTopModal(token) || !root) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        escapeRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) {
        e.preventDefault()
        root.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      removeModal(token)
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [ref])
}
