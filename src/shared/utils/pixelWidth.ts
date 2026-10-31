import { ARIAL_DEFAULT_WIDTH, ARIAL_WIDTHS } from '../constants/arialWidths'

export function pixelWidth(text: string, fontPx: number): number {
  let units = 0
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0
    units += code >= 32 && code <= 126 ? ARIAL_WIDTHS[code - 32] : ARIAL_DEFAULT_WIDTH
  }
  return Math.round((units * fontPx) / 1000)
}
