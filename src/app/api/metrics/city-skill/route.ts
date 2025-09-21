import { withCachedRateLimitedApi } from '@/server/http/handler'
import { getCitySkillTrendDb } from '@/server/jobs/analytics/citySkill'
import { parseCitySkillParams } from '@/shared/params/schemas'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withCachedRateLimitedApi(
  { windowMs: 60_000, max: 60, by: 'ip+path' },
  async (req) => {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed // pagination irrelevant

    void page
    void pageSize

    const { skill, seriesCities, topCityCount } = parseCitySkillParams(searchParams)
    const result = await getCitySkillTrendDb(filters, skill, seriesCities, topCityCount)

    return Response.json(result)
  },
)
