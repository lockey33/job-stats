import { NextRequest } from 'next/server';
import { getAllJobs } from '@/server/jobs/repository';
import { applyFilters, paginate, dedupeById } from '@/features/jobs/utils/filtering';
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = parseFiltersFromSearchParams(searchParams);
    const { page, pageSize, ...filters } = parsed;

    const jobs = await getAllJobs();
    const filtered = applyFilters(jobs, filters);
    const unique = dedupeById(filtered);
    // Sort by date desc (ISO strings compare lexicographically)
    const sorted = unique.slice().sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
    const result = paginate(sorted, { page, pageSize });

    return Response.json(result, { status: 200, headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } });
  } catch (e: unknown) {
    console.error('[api/jobs] error:', e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
