import type { NextRequest } from 'next/server'

import { getDbVersion, queryJobsDb } from '@/server/jobs/repository.prisma'
import { buildEtag } from '@/shared/react-query/keys'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed

    const result = await queryJobsDb(filters, { page, pageSize })
    const version = await getDbVersion()

    const etag = buildEtag(version, 'jobs', { page, pageSize, ...filters })
    const inm = req.headers.get('if-none-match') || ''
    if (inm === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } })
    }

    return Response.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
        ETag: etag,
      },
    })
  } catch (e: unknown) {
    console.error('[api/jobs] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
