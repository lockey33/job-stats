import type { NextRequest } from 'next/server'

import { getCitySkillTrendDb } from '@/server/jobs/analytics.prisma'
import { getDbVersion } from '@/server/jobs/repository.prisma'
import { parseCitySkillParams } from '@/shared/params/schemas'
import { buildEtag } from '@/shared/react-query/keys'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed // pagination irrelevant
    void page
    void pageSize

    const { skill, seriesCities, topCityCount } = parseCitySkillParams(searchParams)
    const result = await getCitySkillTrendDb(filters, skill, seriesCities, topCityCount)
    const version = await getDbVersion()

    const etag = buildEtag(version, 'city-skill', { ...filters, skill, seriesCities, topCityCount })
    const inm = req.headers.get('if-none-match') || ''
    if (inm === etag) return new Response(null, { status: 304, headers: { ETag: etag } })

    return Response.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
        ETag: etag,
      },
    })
  } catch (e: unknown) {
    console.error('[api/analytics/city-skill] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
