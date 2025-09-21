import type { NextRequest } from 'next/server'

import { getMetricsDb } from '@/server/jobs/analytics.prisma'
import { getDbVersion } from '@/server/jobs/repository.prisma'
import { parseMetricsParams } from '@/shared/params/schemas'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed // pagination irrelevant for analytics
    void page
    void pageSize

    const { seriesSkills, topSkillsCount } = parseMetricsParams(searchParams)
    const [result, version] = await Promise.all([
      getMetricsDb(filters, topSkillsCount, seriesSkills),
      getDbVersion(),
    ])

    return Response.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
      },
    })
  } catch (e: unknown) {
    console.error('[api/analytics] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
