import { NextRequest } from 'next/server';
import { getAllJobs } from '@/lib/infrastructure/repository';
import { parseFiltersFromSearchParams } from '@/lib/utils/filters';
import { computeCitySkillTrend } from '@/lib/application/analytics';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseFiltersFromSearchParams(searchParams);
    const { page: _p, pageSize: _ps, ...filters } = parsed; // pagination irrelevant

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
    return Response.json(result, { status: 200 });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
