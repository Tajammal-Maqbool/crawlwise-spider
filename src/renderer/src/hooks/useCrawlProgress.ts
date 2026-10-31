import { useEffect, useState } from 'react'
import type { CrawlProgress } from '@shared/interfaces/crawlProgress'
import { api } from '../services/ipc/api'

export function useCrawlProgress(): CrawlProgress | null {
  const [progress, setProgress] = useState<CrawlProgress | null>(null)
  useEffect(() => api.onProgress(setProgress), [])
  return progress
}
