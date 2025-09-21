import { withCachedRateLimitedApi } from '@/server/http/handler'
import { getEmergingDb } from '@/server/jobs/analytics/emerging'
import { parseEmergingParams } from '@/shared/params/schemas'
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

    const { monthsWindow, topK, minTotalCount } = parseEmergingParams(searchParams)
    const payload = await getEmergingDb(filters, monthsWindow, topK, minTotalCount)

    return Response.json(payload)
  },
)
