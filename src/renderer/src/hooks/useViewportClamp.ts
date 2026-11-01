import { useLayoutEffect, useState, type RefObject } from 'react'
import type { Point } from '../interfaces/viewportGeometry'
import { clampToViewport } from '../utils/clampToViewport'

export function useViewportClamp(ref: RefObject<HTMLElement | null>, x: number, y: number): Point {
  const [position, setPosition] = useState<Point>({ x, y })
  useLayoutEffect(() => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return setPosition({ x, y })
    setPosition(clampToViewport({ x, y }, { width: rect.width, height: rect.height }, { width: window.innerWidth, height: window.innerHeight }))
  }, [ref, x, y])
  return position
}
