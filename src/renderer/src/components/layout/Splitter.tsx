import { useCallback } from 'react'
import type { SplitterProps } from '../../interfaces/layoutProps'
import { readStored, writeStored } from '../../utils/safeStorage'

export function restoreSplitSizes(defaults: Record<string, number>): void {
  for (const [cssVar, fallback] of Object.entries(defaults)) {
    document.documentElement.style.setProperty(cssVar, `${readStored(`split${cssVar}`, fallback)}px`)
  }
}

export function Splitter({ orientation, cssVar, min, max, invert }: SplitterProps) {
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const root = document.documentElement
      const startPos = orientation === 'vertical' ? e.clientX : e.clientY
      const startSize = parseFloat(getComputedStyle(root).getPropertyValue(cssVar)) || min
      let size = startSize
      const move = (ev: PointerEvent) => {
        const delta = (orientation === 'vertical' ? ev.clientX : ev.clientY) - startPos
        size = Math.min(max, Math.max(min, startSize + (invert ? -delta : delta)))
        root.style.setProperty(cssVar, `${size}px`)
      }
      const up = () => {
        window.removeEventListener('pointermove', move)
        window.removeEventListener('pointerup', up)
        writeStored(`split${cssVar}`, size)
      }
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
    },
    [orientation, cssVar, min, max, invert]
  )
  return (
    <div
      className={`splitter ${orientation === 'horizontal' ? 'horizontal' : ''}`}
      role="separator"
      aria-orientation={orientation}
      onPointerDown={onPointerDown}
    />
  )
}
