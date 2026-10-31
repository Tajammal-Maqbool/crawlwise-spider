import { useEffect, useState } from 'react'
import type { UrlDetail } from '@shared/interfaces/urlDetail'
import { api } from '../services/ipc/api'

export function useUrlDetail(crawlId: string | null, urlId: number | null): UrlDetail | null {
  const [detail, setDetail] = useState<UrlDetail | null>(null)
  useEffect(() => {
    if (!crawlId || urlId === null) {
      setDetail(null)
      return
    }
    let cancelled = false
    api
      .getDetail(crawlId, urlId)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch(() => {
        if (!cancelled) setDetail(null)
      })
    return () => {
      cancelled = true
    }
  }, [crawlId, urlId])
  return detail
}
