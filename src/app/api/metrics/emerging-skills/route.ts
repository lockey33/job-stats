import { NextRequest } from 'next/server';
import { getEmergingCached } from '@/server/jobs/analytics';
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseFiltersFromSearchParams(searchParams);
    const { page, pageSize, ...filters } = parsed;
    void page; void pageSize;

    const monthsWindow = Number.parseInt(searchParams.get('monthsWindow') || '12', 10);
    const topK = Number.parseInt(searchParams.get('topK') || '10', 10);
    const minTotalCount = Number.parseInt(searchParams.get('minTotalCount') || '5', 10);

    const payload = await getEmergingCached(filters, monthsWindow, topK, minTotalCount);
    return Response.json(payload, { status: 200, headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
  } catch (e: unknown) {
    console.error('[api/metrics/emerging-skills] error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
