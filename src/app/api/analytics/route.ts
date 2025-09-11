import { NextRequest } from 'next/server';
import { getAllJobs } from '@/lib/infrastructure/repository';
import { parseFiltersFromSearchParams } from '@/lib/utils/filters';
import { computeAnalytics } from '@/lib/application/analytics';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseFiltersFromSearchParams(searchParams);
    const { page: _p, pageSize: _ps, ...filters } = parsed; // pagination irrelevant for analytics
    const seriesSkillsParam = searchParams.get('seriesSkills') || '';
    const seriesSkills = seriesSkillsParam
      ? seriesSkillsParam.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const jobs = await getAllJobs();
    const result = computeAnalytics(jobs, filters, 10, seriesSkills);

    return Response.json(result, { status: 200 });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
