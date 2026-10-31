import { useEffect, useState } from 'react'

const LIVE_REFRESH_MS = 2000

export function useRefreshTick(live: boolean, finishedKey: string): number {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => setTick((t) => t + 1), LIVE_REFRESH_MS)
    return () => clearInterval(timer)
  }, [live])
  useEffect(() => setTick((t) => t + 1), [finishedKey])
  return tick
}
