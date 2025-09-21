import { getDbVersion, getMetaFacetsDb } from '@/server/jobs/repository.prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request) {
  try {
    const [facets, version] = await Promise.all([getMetaFacetsDb(), getDbVersion()])

    return Response.json(facets, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
      },
    })
  } catch (e: unknown) {
    console.error('[api/meta] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
