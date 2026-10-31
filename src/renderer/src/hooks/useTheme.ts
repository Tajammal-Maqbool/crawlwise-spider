import { useCallback, useEffect, useState } from 'react'
import type { Theme } from '../types/theme'
import { readStored, writeStored } from '../utils/safeStorage'

const KEY = 'theme'

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setState] = useState<Theme>(() => (readStored<string>(KEY, 'light') === 'dark' ? 'dark' : 'light'))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setState(next)
    writeStored(KEY, next)
  }, [])

  return [theme, setTheme]
}
