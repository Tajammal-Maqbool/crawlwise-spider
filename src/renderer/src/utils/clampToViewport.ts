import type { Point, Size } from '../interfaces/viewportGeometry'

export function clampToViewport(position: Point, size: Size, viewport: Size): Point {
  return {
    x: Math.max(0, Math.min(position.x, viewport.width - size.width)),
    y: Math.max(0, Math.min(position.y, viewport.height - size.height))
  }
}
