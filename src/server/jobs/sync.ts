import 'server-only'

import { getPrisma } from '@/server/db/prisma'
import { fetchPage } from '@/server/jobs/feed'
import { isClearlyEmpty, upsertJobAndSkills, validateItems } from '@/server/jobs/upsert'

export async function syncJobs({
  fromISO,
  toISO,
  limitPerPage = 5000,
  maxBatches = 10,
}: {
  fromISO?: string
  toISO?: string
  limitPerPage?: number
  maxBatches?: number
} = {}) {
  const prisma = await getPrisma()
  const max = await prisma.job.aggregate({ _max: { createdAt: true } })
  const dbPivot = max._max.createdAt ? new Date(max._max.createdAt.getTime() + 1000) : null
  let pivot: Date
  if (fromISO) {
    const from = new Date(fromISO)
    pivot = dbPivot ? new Date(Math.max(from.getTime(), dbPivot.getTime())) : from
  } else {
    pivot = dbPivot ?? new Date(Date.now() - 7 * 24 * 3600 * 1000)
  }
  const startISO = pivot.toISOString()
  const endISO = toISO ? new Date(toISO).toISOString() : new Date().toISOString()

  const limit = Math.max(100, Math.min(10000, Number(limitPerPage) || 5000))
  let offset = 0
  let processed = 0
  const uniqueKeys = new Set<string>()
  let batches = 0
  const skillCache = new Map<string, number>()
  let lastPageSignature: string | null = null
  const startMs = new Date(startISO).getTime()
  const endMs = new Date(endISO).getTime()
  for (;;) {
    const raw = await fetchPage({ startISO, endISO, limit, offset })
    if (raw.length === 0) break
    const valid = validateItems(raw)
    const items = (valid ?? [])
      .filter((it) => !isClearlyEmpty(it))
      .filter((it) => {
        const t = new Date(it.created_at).getTime()
        return Number.isFinite(t) && t >= startMs && t <= endMs
      })
    if (items.length === 0) break
    // Detect non-advancing pagination to prevent infinite loops
    const head = items[0] as { id?: unknown; slug?: unknown; job_slug?: unknown } | undefined
    const tail = items[items.length - 1] as
      | { id?: unknown; slug?: unknown; job_slug?: unknown }
      | undefined
    const sig = `${String(head?.slug || head?.job_slug || head?.id || '')}|${String(tail?.slug || tail?.job_slug || tail?.id || '')}|${items.length}`
    if (lastPageSignature === sig) break
    lastPageSignature = sig

    for (const it of items) {
      // Track unique keys based on slug/job_slug/id
      const ukey = String(it.slug || it.job_slug || it.id)
      uniqueKeys.add(ukey)
      await upsertJobAndSkills(prisma, it, skillCache)
    }
    processed += items.length
    offset += limit
    batches += 1
    if (items.length < limit) break
    if (batches >= maxBatches) break
  }
  return { imported: uniqueKeys.size, processed, from: startISO, to: endISO }
}
