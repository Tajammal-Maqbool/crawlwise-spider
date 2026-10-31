import { useCallback, useEffect, useRef, useState } from 'react'
import type { SortDirection } from '@shared/types/sortDirection'
import { api } from '../services/ipc/api'

const PAGE_SIZE = 200

export interface GridParams {
  crawlId: string | null
  filterKey: string
  sortKey: string | null
  sortDirection: SortDirection
  search: string
  tick: number
}

export interface GridData {
  total: number
  rowAt: (index: number) => Record<string, unknown> | undefined
  requestRange: (start: number, end: number) => void
  error: string | null
  retry: () => void
}

export function useGridPage(params: GridParams): GridData {
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const pages = useRef(new Map<number, Array<Record<string, unknown>>>())
  const pending = useRef(new Set<number>())
  const lastRange = useRef<[number, number]>([0, PAGE_SIZE])
  const generation = useRef(0)

  const loadPage = useCallback(
    (page: number, force = false) => {
      const { crawlId, filterKey, sortKey, sortDirection, search } = params
      const inFlight = pending.current
      if (!crawlId || inFlight.has(page) || (!force && pages.current.has(page))) return
      inFlight.add(page)
      const gen = generation.current
      api
        .getPage({ crawlId, filterKey, sortKey, sortDirection, search, offset: page * PAGE_SIZE, limit: PAGE_SIZE })
        .then((result) => {
          if (gen !== generation.current) return
          pages.current.set(page, result.rows)
          setTotal(result.total)
          setError(null)
          setVersion((v) => v + 1)
        })
        .catch((err: unknown) => {
          if (gen === generation.current) setError(err instanceof Error ? err.message : String(err))
        })
        .finally(() => inFlight.delete(page))
    },
    [params.crawlId, params.filterKey, params.sortKey, params.sortDirection, params.search]
  )

  const requestRange = useCallback(
    (start: number, end: number, force = false) => {
      lastRange.current = [start, end]
      const first = Math.floor(start / PAGE_SIZE)
      const last = Math.floor(Math.max(end, start) / PAGE_SIZE)
      for (let p = first; p <= last; p += 1) loadPage(p, force)
    },
    [loadPage]
  )

  const reset = useCallback(
    (keepRows = false) => {
      generation.current += 1
      if (!keepRows) pages.current.clear()
      pending.current = new Set()
      const [start, end] = lastRange.current
      requestRange(start, end, keepRows)
    },
    [requestRange]
  )

  useEffect(() => {
    lastRange.current = [0, PAGE_SIZE]
    setTotal(0)
    reset()
  }, [params.crawlId, params.filterKey, params.sortKey, params.sortDirection, params.search])

  useEffect(() => {
    if (params.tick > 0) reset(true)
  }, [params.tick])

  const rowAt = useCallback(
    (index: number) => pages.current.get(Math.floor(index / PAGE_SIZE))?.[index % PAGE_SIZE],
    [version]
  )

  return { total, rowAt, requestRange: (start, end) => requestRange(start, end), error, retry: () => reset() }
}
