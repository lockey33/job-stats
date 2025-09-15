import { NextRequest } from 'next/server'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'
import { getTopSkillsCached } from '@/server/jobs/analytics'
import { parseTopSkillsParams } from '@/shared/params/schemas'
import { getDatasetVersion } from '@/server/jobs/repository'
import { buildEtag } from '@/shared/react-query/keys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed
    void page
    void pageSize

    const { count } = parseTopSkillsParams(searchParams)
    const [topSkills, version] = await Promise.all([
      getTopSkillsCached(filters, count),
      getDatasetVersion(),
    ])

    const etag = buildEtag(version, 'top-skills', { ...filters, count })
    const inm = req.headers.get('if-none-match') || ''
    if (inm === etag) return new Response(null, { status: 304, headers: { ETag: etag } })

    return Response.json(
      { topSkills },
      {
        status: 200,
        headers: {
          'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
          'X-Data-Version': version,
          ETag: etag,
        },
      },
    )
  } catch (e: unknown) {
    console.error('[api/metrics/top-skills] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
