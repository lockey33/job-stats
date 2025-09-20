import 'server-only'

import { env } from '@/env'

export function extractItemsFromPayload(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>
    for (const k of ['items', 'data', 'rows', 'results', 'records', 'docs']) {
      const v = obj[k]
      if (Array.isArray(v)) return v
    }
  }
  return null
}

type PageArgs = { startISO: string; endISO: string; limit: number; offset: number }

export async function fetchPage({ startISO, endISO, limit, offset }: PageArgs): Promise<unknown[]> {
  const base = env.INGEST_FEED_URL
  if (!base) throw new Error('INGEST_FEED_URL is not set')

  const dateModes: Array<[string, string]> = [
    ['startDate', 'endDate'],
    ['from', 'to'],
    ['start', 'end'],
    ['date_from', 'date_to'],
  ]

  const page = Math.floor(offset / Math.max(1, limit)) + 1
  const paginationModes: Array<(url: URL) => void> = [
    (url) => {
      url.searchParams.set('limit', String(limit))
      url.searchParams.set('offset', String(offset))
    },
    (url) => {
      url.searchParams.set('limit', String(limit))
      url.searchParams.set('skip', String(offset))
    },
    (url) => {
      url.searchParams.set('page', String(page))
      url.searchParams.set('per_page', String(limit))
    },
    (url) => {
      url.searchParams.set('page', String(page))
      url.searchParams.set('page_size', String(limit))
    },
    (url) => {
      url.searchParams.set('page', String(page))
      url.searchParams.set('size', String(limit))
    },
  ]

  async function tryFetch(startKey: string, endKey: string): Promise<unknown[] | null> {
    for (const applyPagination of paginationModes) {
      const url = new URL(base!)
      applyPagination(url)
      url.searchParams.set(startKey, startISO)
      url.searchParams.set(endKey, endISO)
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (!res.ok) continue
      const json = (await res.json().catch(() => null as unknown)) as unknown
      const arr = extractItemsFromPayload(json)
      if (arr) return arr
      if (offset > 0) return []
    }
    return null
  }

  for (const [sKey, eKey] of dateModes) {
    const arr = await tryFetch(sKey, eKey)
    if (arr && arr.length > 0) return arr
    if (arr && arr.length === 0) {
      if (offset > 0) return []
    }
  }
  // Fallback: try without date filters, only pagination
  for (const applyPagination of paginationModes) {
    const url = new URL(base!)
    applyPagination(url)
    const res = await fetch(url, { headers: { accept: 'application/json' } })
    if (!res.ok) continue
    const json = (await res.json().catch(() => null as unknown)) as unknown
    const arr = extractItemsFromPayload(json)
    if (arr) return arr
  }
  return []
}
