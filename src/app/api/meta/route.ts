import { NextRequest } from 'next/server';
import { getAllJobs } from '@/lib/infrastructure/repository';
import { computeFacets } from '@/lib/application/filtering';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    const jobs = await getAllJobs();
    const facets = computeFacets(jobs);
    return Response.json(facets, { status: 200 });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
