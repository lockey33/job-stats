import { NextRequest } from 'next/server';
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams';
import { getMetricsCached } from '@/server/jobs/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseFiltersFromSearchParams(searchParams);
    const { page, pageSize, ...filters } = parsed; // pagination irrelevant for analytics
    void page; void pageSize;
    const seriesSkillsParam = searchParams.get('seriesSkills') || '';
    const seriesSkills = seriesSkillsParam
      ? seriesSkillsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;
    const topSkillsCountRaw = searchParams.get('topSkillsCount');
    const topSkillsCount = topSkillsCountRaw ? Number.parseInt(topSkillsCountRaw, 10) : undefined;
    const topCount = Number.isFinite(topSkillsCount as number) && (topSkillsCount as number) > 0
      ? Math.min(Math.max(topSkillsCount as number, 1), 200)
      : 10;

    const result = await getMetricsCached(filters, topCount, seriesSkills);

    return Response.json(result, { status: 200, headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
  } catch (e: unknown) {
    console.error('[api/analytics] error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
