import { useCallback, useState } from 'react'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { mergeConfig } from '@shared/utils/mergeConfig'
import { readStored, writeStored } from '../utils/safeStorage'

const KEY = 'crawlConfig'

export function useStoredConfig(): [CrawlConfig, (config: CrawlConfig) => void] {
  const [config, setState] = useState<CrawlConfig>(() => mergeConfig(readStored<Partial<CrawlConfig>>(KEY, {})))
  const setConfig = useCallback((next: CrawlConfig) => {
    setState(next)
    writeStored(KEY, next)
  }, [])
  return [config, setConfig]
}
