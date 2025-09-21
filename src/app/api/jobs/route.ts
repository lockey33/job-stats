import type { NextRequest } from 'next/server'

import { getDbVersion, queryJobsDb } from '@/server/jobs/repository.prisma'
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

    return Response.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
      },
    })
  } catch (e: unknown) {
    console.error('[api/jobs] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
