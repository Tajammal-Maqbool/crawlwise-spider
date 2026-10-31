import { useEffect, useState } from 'react'
import type { SiteStructure } from '@shared/interfaces/siteStructure'
import { api } from '../services/ipc/api'

export function useSiteStructure(crawlId: string | null, tick: number): SiteStructure | null {
  const [structure, setStructure] = useState<SiteStructure | null>(null)
  useEffect(() => {
    if (!crawlId) {
      setStructure(null)
      return
    }
    let cancelled = false
    api
      .getSiteStructure(crawlId)
      .then((s) => {
        if (!cancelled) setStructure(s)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [crawlId, tick])
  return structure
}
