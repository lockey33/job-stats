import { withCachedRateLimitedApi } from '@/server/http/handler'
import { getMetricsDb } from '@/server/jobs/analytics/metrics'
import { parseMetricsParams } from '@/shared/params/schemas'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withCachedRateLimitedApi(
  { windowMs: 60_000, max: 60, by: 'ip+path' },
  async (req) => {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed // pagination irrelevant for analytics

    void page
    void pageSize

    const { seriesSkills, topSkillsCount } = parseMetricsParams(searchParams)
    const result = await getMetricsDb(filters, topSkillsCount, seriesSkills)

    return Response.json(result)
  },
)
