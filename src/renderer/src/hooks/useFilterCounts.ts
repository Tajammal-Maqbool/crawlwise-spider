import { useEffect, useState } from 'react'
import type { FilterCounts } from '@shared/interfaces/filterCount'
import { api } from '../services/ipc/api'

export function useFilterCounts(crawlId: string | null, tick: number): FilterCounts {
  const [counts, setCounts] = useState<FilterCounts>({})
  useEffect(() => {
    if (!crawlId) {
      setCounts({})
      return
    }
    let cancelled = false
    api
      .getCounts(crawlId)
      .then((c) => {
        if (!cancelled) setCounts(c)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [crawlId, tick])
  return counts
}
