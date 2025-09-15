import type { NextRequest } from 'next/server'

import type { JobFilters } from '@/features/jobs/types/types'
import {
  clearAnalyticsCaches,
  getEmergingCached,
  getMetricsCached,
  getTopSkillsCached,
} from '@/server/jobs/analytics'
import { clearFacetsCache, getMetaFacets } from '@/server/jobs/facets'
import { clearCache as clearRepoCache, getDatasetVersion } from '@/server/jobs/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(req: NextRequest): boolean {
  const configured = process.env.ADMIN_SECRET
  if (!configured) return false
  const header = req.headers.get('x-admin-secret') || ''
  return header === configured
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    const hasSecret = !!process.env.ADMIN_SECRET
    const msg = hasSecret
      ? 'Unauthorized: provide x-admin-secret header'
      : 'ADMIN_SECRET env var is not configured.'
    return Response.json({ ok: false, error: msg }, { status: 401 })
  }

  const warm = new URL(req.url).searchParams.get('warm') === 'true'

  // Clear caches
  clearAnalyticsCaches()
  clearFacetsCache()
  clearRepoCache()

  let version: string | null = null
  try {
    version = await getDatasetVersion()
  } catch {}

  if (warm) {
    try {
      await Promise.all([
        getMetaFacets(),
        getMetricsCached({} as unknown as JobFilters),
        getTopSkillsCached({} as unknown as JobFilters, 50),
        getEmergingCached({} as unknown as JobFilters, 12, 10, 5),
      ])
    } catch {}
  }

  return Response.json({ ok: true, version, warmed: warm })
}

export async function GET() {
  // POST only for mutation
  return new Response(null, { status: 405, headers: { Allow: 'POST' } })
}
