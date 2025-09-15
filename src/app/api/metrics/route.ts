import { NextRequest } from 'next/server'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'
import { getMetricsCached } from '@/server/jobs/analytics'
import { parseMetricsParams } from '@/server/api/schemas'
import { getDatasetVersion } from '@/server/jobs/repository'
import { stableStringify } from '@/shared/utils/stableStringify'

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
      getMetricsCached(filters, topSkillsCount, seriesSkills),
      getDatasetVersion(),
    ])

    const etag = `W/"${version}|${stableStringify({ filters, topSkillsCount, seriesSkills })}"`
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
    console.error('[api/analytics] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
