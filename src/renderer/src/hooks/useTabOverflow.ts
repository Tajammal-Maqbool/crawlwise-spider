import { useLayoutEffect, useRef, useState, type RefObject } from 'react'

const OVERFLOW_BUTTON_WIDTH = 44

export function useTabOverflow(count: number): { containerRef: RefObject<HTMLDivElement | null>; measureRef: RefObject<HTMLDivElement | null>; visible: number } {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(count)

  useLayoutEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return
    const update = () => {
      const widths = Array.from(measure.children).map((c) => (c as HTMLElement).offsetWidth)
      const total = widths.reduce((s, w) => s + w, 0)
      const available = container.clientWidth
      if (total <= available) return setVisible(count)
      let used = OVERFLOW_BUTTON_WIDTH
      let n = 0
      while (n < widths.length && used + widths[n] <= available) used += widths[n++]
      setVisible(Math.max(1, n))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [count])

  return { containerRef, measureRef, visible }
}
