import { useCallback, useEffect, useState } from 'react'
import type { GoogleAccountStatus, GoogleProperty } from '@shared/interfaces/googleAccount'
import type { GoogleAccountState } from '../interfaces/googleProps'
import { api } from '../services/ipc/api'
import { ipcErrorMessage } from '../utils/ipcErrorMessage'

export function useGoogleAccount(): GoogleAccountState {
  const [status, setStatus] = useState<GoogleAccountStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sites, setSites] = useState<GoogleProperty[]>([])
  const [properties, setProperties] = useState<GoogleProperty[]>([])

  useEffect(() => {
    api.googleStatus().then(setStatus, (err: unknown) => setError(ipcErrorMessage(err)))
  }, [])

  const run = useCallback(async (work: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await work()
    } catch (err) {
      setError(ipcErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }, [])

  const connect = useCallback((clientId: string, clientSecret: string) => run(async () => setStatus(await api.connectGoogle(clientId, clientSecret))), [run])
  const disconnect = useCallback(
    () =>
      run(async () => {
        setStatus(await api.disconnectGoogle())
        setSites([])
        setProperties([])
      }),
    [run]
  )
  const loadSites = useCallback(() => run(async () => setSites(await api.listSearchConsoleSites())), [run])
  const loadProperties = useCallback(() => run(async () => setProperties(await api.listAnalyticsProperties())), [run])

  return { status, busy, error, sites, properties, connect, disconnect, loadSites, loadProperties }
}
