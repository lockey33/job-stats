import { NextRequest } from 'next/server';
import { getAllJobs } from '@/server/jobs/repository';
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams';
import { computeCitySkillTrend } from '@/features/jobs/utils/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseFiltersFromSearchParams(searchParams);
    const { page, pageSize, ...filters } = parsed; // pagination irrelevant
    void page; void pageSize;

    const skill = searchParams.get('skill') || '';
    if (!skill) return Response.json({ error: 'Missing skill' }, { status: 400 });

    const seriesCitiesParam = searchParams.get('seriesCities') || '';
    const seriesCities = seriesCitiesParam
      ? seriesCitiesParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const tcc = searchParams.get('topCityCount');
    const topCityCount = tcc ? Math.max(1, Math.min(12, parseInt(tcc))) : 5;

    const jobs = await getAllJobs();
    const result = computeCitySkillTrend(jobs, filters, skill, seriesCities, topCityCount);
    return Response.json(result, { status: 200, headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
  } catch (e: unknown) {
    console.error('[api/analytics/city-skill] error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
