import { useEffect, useState } from 'react'
import type { UrlDetail } from '@shared/interfaces/urlDetail'
import type { AsyncData } from '../interfaces/asyncData'
import { api } from '../services/ipc/api'
import { ipcErrorMessage } from '../utils/ipcErrorMessage'

const IDLE: AsyncData<UrlDetail> = { data: null, loading: false, error: null }

export function useUrlDetail(crawlId: string | null, urlId: number | null): AsyncData<UrlDetail> {
  const [state, setState] = useState<AsyncData<UrlDetail>>(IDLE)
  useEffect(() => {
    if (!crawlId || urlId === null) {
      setState(IDLE)
      return
    }
    setState({ data: null, loading: true, error: null })
    let cancelled = false
    api.getDetail(crawlId, urlId).then(
      (data) => !cancelled && setState({ data, loading: false, error: null }),
      (err: unknown) => !cancelled && setState({ data: null, loading: false, error: ipcErrorMessage(err) })
    )
    return () => {
      cancelled = true
    }
  }, [crawlId, urlId])
  return state
}
