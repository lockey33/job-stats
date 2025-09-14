import 'server-only';
import type { MetaFacets } from '@/features/jobs/types/types';
import { computeFacets } from '@/features/jobs/utils/filtering';
import { getAllJobs, getDatasetVersion } from './repository';

let cache: { version: string; facets: MetaFacets } | null = null;

export async function getMetaFacets(): Promise<MetaFacets> {
  const [version, jobs] = await Promise.all([getDatasetVersion(), getAllJobs()]);
  if (cache && cache.version === version) return cache.facets;
  const facets = computeFacets(jobs);
  cache = { version, facets };
  return facets;
}

export function clearFacetsCache() {
  cache = null;
}
