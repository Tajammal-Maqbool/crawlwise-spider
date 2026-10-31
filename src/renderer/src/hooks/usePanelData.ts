import { useEffect, useState } from 'react'
import { ipcErrorMessage } from '../utils/ipcErrorMessage'

export function usePanelData<T>(crawlId: string | null, tick: number, load: (crawlId: string) => Promise<T>): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!crawlId) {
      setData(null)
      return
    }
    let live = true
    load(crawlId).then(
      (d) => live && (setData(d), setError(null)),
      (err: unknown) => live && setError(ipcErrorMessage(err))
    )
    return () => {
      live = false
    }
  }, [crawlId, tick, load])

  return { data, error }
}
