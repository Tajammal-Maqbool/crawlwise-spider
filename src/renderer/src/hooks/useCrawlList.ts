import { useCallback, useEffect, useState } from 'react'
import type { CrawlSummary } from '@shared/interfaces/crawlSummary'
import { api } from '../services/ipc/api'

export function useCrawlList(open: boolean): { crawls: CrawlSummary[]; reload: () => void } {
  const [crawls, setCrawls] = useState<CrawlSummary[]>([])
  const reload = useCallback(() => {
    api.listCrawls().then(setCrawls).catch(() => setCrawls([]))
  }, [])
  useEffect(() => {
    if (open) reload()
  }, [open, reload])
  return { crawls, reload }
}
