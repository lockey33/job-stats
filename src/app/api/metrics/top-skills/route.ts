import { withCachedRateLimitedApi } from '@/server/http/handler'
import { getTopSkillsDb } from '@/server/jobs/analytics/topSkills'
import { parseTopSkillsParams } from '@/shared/params/schemas'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withCachedRateLimitedApi(
  { windowMs: 60_000, max: 60, by: 'ip+path' },
  async (req) => {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed

    void page
    void pageSize

    const { count } = parseTopSkillsParams(searchParams)
    const topSkills = await getTopSkillsDb(filters, count)

    return Response.json({ topSkills })
  },
)
