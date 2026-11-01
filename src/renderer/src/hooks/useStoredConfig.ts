import { useCallback, useEffect, useRef, useState } from 'react'
import type { CrawlConfig } from '@shared/interfaces/crawlConfig'
import { mergeConfig } from '@shared/utils/mergeConfig'
import { extractSecrets, hasSecrets, mergeSecrets, stripSecrets } from '@shared/utils/configSecrets'
import { readStored, writeStored } from '../utils/safeStorage'
import { api } from '../services/ipc/api'
import type { StoredConfigState } from '../interfaces/storedConfigState'

const KEY = 'crawlConfig'

export function useStoredConfig(): StoredConfigState {
  const [config, setState] = useState<CrawlConfig>(() => mergeConfig(readStored<Partial<CrawlConfig>>(KEY, {})))
  const [secretsPersistent, setSecretsPersistent] = useState(true)
  const savedSecrets = useRef(extractSecrets(config))

  useEffect(() => {
    let cancelled = false
    const legacy = extractSecrets(readStored<Partial<CrawlConfig>>(KEY, {}))
    const load = hasSecrets(legacy) ? api.saveSecrets(legacy) : api.getSecrets()
    load
      .then((status) => {
        if (cancelled) return
        if (hasSecrets(legacy)) writeStored(KEY, stripSecrets(mergeConfig(readStored<Partial<CrawlConfig>>(KEY, {}))))
        savedSecrets.current = status.secrets
        setSecretsPersistent(status.persistent)
        setState((current) => mergeSecrets(current, status.secrets))
      })
      .catch(() => setSecretsPersistent(false))
    return () => {
      cancelled = true
    }
  }, [])

  const setConfig = useCallback((next: CrawlConfig) => {
    setState(next)
    writeStored(KEY, stripSecrets(next))
    const secrets = extractSecrets(next)
    const previous = savedSecrets.current
    if (secrets.pagespeedApiKey === previous.pagespeedApiKey && secrets.aiApiKey === previous.aiApiKey) return
    savedSecrets.current = secrets
    api
      .saveSecrets(secrets)
      .then((status) => setSecretsPersistent(status.persistent))
      .catch(() => setSecretsPersistent(false))
  }, [])

  return { config, setConfig, secretsPersistent }
}
