import type { NextRequest } from 'next/server'

import { getEmergingDb } from '@/server/jobs/analytics.prisma'
import { getDbVersion } from '@/server/jobs/repository.prisma'
import { parseEmergingParams } from '@/shared/params/schemas'
import { buildEtag } from '@/shared/react-query/keys'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed
    void page
    void pageSize

    const { monthsWindow, topK, minTotalCount } = parseEmergingParams(searchParams)
    const [payload, version] = await Promise.all([
      getEmergingDb(filters, monthsWindow, topK, minTotalCount),
      getDbVersion(),
    ])

    const etag = buildEtag(version, 'emerging', { ...filters, monthsWindow, topK, minTotalCount })
    const inm = req.headers.get('if-none-match') || ''
    if (inm === etag) return new Response(null, { status: 304, headers: { ETag: etag } })

    return Response.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
        ETag: etag,
      },
    })
  } catch (e: unknown) {
    console.error('[api/metrics/emerging-skills] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
