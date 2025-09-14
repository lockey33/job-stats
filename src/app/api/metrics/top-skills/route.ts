import { NextRequest } from 'next/server';
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams';
import { getTopSkillsCached } from '@/server/jobs/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseFiltersFromSearchParams(searchParams);
    const { page, pageSize, ...filters } = parsed;
    void page; void pageSize;

    const countRaw = searchParams.get('count');
    const count = countRaw ? Number.parseInt(countRaw, 10) : 50;
    const topCount = Number.isFinite(count) && count > 0 ? Math.min(Math.max(count, 1), 200) : 50;

    const topSkills = await getTopSkillsCached(filters, topCount);
    return Response.json({ topSkills }, { status: 200, headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
  } catch (e: unknown) {
    console.error('[api/metrics/top-skills] error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
