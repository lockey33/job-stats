import { withCachedApi } from '@/server/http/handler'
import { queryJobsDb } from '@/server/jobs/repository'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withCachedApi(async (req) => {
  const { searchParams } = new URL(req.url)
  const parsed = parseFiltersFromSearchParams(searchParams)
  const { page, pageSize, ...filters } = parsed

  const result = await queryJobsDb(filters, { page, pageSize })

  return Response.json(result)
})
