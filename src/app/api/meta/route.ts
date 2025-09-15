import { getMetaFacets } from '@/server/jobs/facets'
import { getDatasetVersion } from '@/server/jobs/repository'
import { buildEtag } from '@/shared/react-query/keys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const [facets, version] = await Promise.all([getMetaFacets(), getDatasetVersion()])

    const etag = buildEtag(version, 'meta')
    const inm =
      (req && 'headers' in req ? (req as Request).headers.get('if-none-match') : null) || ''
    if (inm === etag) return new Response(null, { status: 304, headers: { ETag: etag } })

    return Response.json(facets, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
        ETag: etag,
      },
    })
  } catch (e: unknown) {
    console.error('[api/meta] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
