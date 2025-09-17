import type { NextRequest } from 'next/server'

import { applyFilters, dedupeById, paginate } from '@/features/jobs/utils/filtering'
import { getAllJobs, getDatasetVersion } from '@/server/jobs/repository'
import { buildEtag } from '@/shared/react-query/keys'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed

    const [jobs, version] = await Promise.all([getAllJobs(), getDatasetVersion()])
    const filtered = applyFilters(jobs, filters)
    const unique = dedupeById(filtered)
    // Sort by date desc (ISO strings compare lexicographically)
    const sorted = unique
      .slice()
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    const result = paginate(sorted, { page, pageSize })

    const etag = buildEtag(version, 'jobs', { page, pageSize, ...filters })
    const inm = req.headers.get('if-none-match') || ''
    if (inm === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } })
    }

    return Response.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
        ETag: etag,
      },
    })
  } catch (e: unknown) {
    console.error('[api/jobs] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
