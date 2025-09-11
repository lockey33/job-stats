import { NextRequest } from 'next/server';
import { getAllJobs } from '@/lib/infrastructure/repository';
import { applyFilters, paginate, dedupeById } from '@/lib/application/filtering';
import { parseFiltersFromSearchParams } from '@/lib/utils/filters';

export const runtime = 'nodejs';

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

    return Response.json(result, { status: 200 });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
