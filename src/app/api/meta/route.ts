import { withCachedRateLimitedApi } from '@/server/http/handler'
import { getMetaFacetsDb } from '@/server/jobs/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withCachedRateLimitedApi(
  { windowMs: 60_000, max: 30, by: 'ip+path' },
  async () => Response.json(await getMetaFacetsDb()),
)
