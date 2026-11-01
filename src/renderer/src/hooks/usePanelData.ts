import { useEffect, useState } from 'react'
import type { AsyncData } from '../interfaces/asyncData'
import { ipcErrorMessage } from '../utils/ipcErrorMessage'

export function usePanelData<T>(crawlId: string | null, tick: number, load: (crawlId: string) => Promise<T>): AsyncData<T> {
  const [state, setState] = useState<AsyncData<T>>({ data: null, loading: false, error: null })

  useEffect(() => {
    setState({ data: null, loading: !!crawlId, error: null })
  }, [crawlId])

  useEffect(() => {
    if (!crawlId) return
    let live = true
    setState((s) => ({ ...s, loading: s.data === null }))
    load(crawlId).then(
      (data) => live && setState({ data, loading: false, error: null }),
      (err: unknown) => live && setState((s) => ({ ...s, loading: false, error: ipcErrorMessage(err) }))
    )
    return () => {
      live = false
    }
  }, [crawlId, tick, load])

  return state
}
