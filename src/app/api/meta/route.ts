import { getMetaFacets } from '@/server/jobs/facets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const facets = await getMetaFacets();
    return Response.json(facets, { status: 200, headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
  } catch (e: unknown) {
    console.error('[api/meta] error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
