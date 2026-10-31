export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}

export function clearStoredPrefix(prefix: string): void {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key)
  } catch {
    return
  }
}
