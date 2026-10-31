export interface Readability {
  sentences: number
  fleschScore: number | null
}

export function readability(text: string): Readability {
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w))
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) ?? []).length)
  if (words.length === 0) return { sentences: 0, fleschScore: null }
  const syllables = words.reduce((sum, w) => sum + syllableCount(w), 0)
  const score = 206.835 - 1.015 * (words.length / sentences) - 84.6 * (syllables / words.length)
  return { sentences, fleschScore: Math.round(score * 10) / 10 }
}

function syllableCount(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) return 1
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '').match(/[aeiouy]{1,2}/g)
  return Math.max(1, groups?.length ?? 1)
}
