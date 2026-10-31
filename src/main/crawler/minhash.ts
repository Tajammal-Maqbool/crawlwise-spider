export const MINHASH_SIZE = 128
const SHINGLE_WORDS = 3

export function minhashSignature(text: string): Uint32Array | null {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean)
  if (words.length < SHINGLE_WORDS) return null
  const signature = new Uint32Array(MINHASH_SIZE).fill(0xffffffff)
  for (let i = 0; i + SHINGLE_WORDS <= words.length; i += 1) {
    const base = fnv1a(words.slice(i, i + SHINGLE_WORDS).join(' '))
    for (let k = 0; k < MINHASH_SIZE; k += 1) {
      const h = mix(base ^ Math.imul(k + 1, 0x9e3779b1))
      if (h < signature[k]) signature[k] = h
    }
  }
  return signature
}

export function similarity(a: Uint32Array, b: Uint32Array): number {
  let same = 0
  for (let k = 0; k < MINHASH_SIZE; k += 1) if (a[k] === b[k]) same += 1
  return same / MINHASH_SIZE
}

function fnv1a(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mix(x: number): number {
  let h = x >>> 0
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}
