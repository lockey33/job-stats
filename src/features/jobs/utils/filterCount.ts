import type { JobFilters } from '@/features/jobs/types/types'

export function countActiveFilters(jf: Partial<JobFilters>): number {
  let c = 0
  const arr = (v?: unknown) => (Array.isArray(v) ? v.length : 0)

  if (typeof jf.q === 'string' && jf.q.trim()) c++
  c += arr(jf.skills)
  c += arr(jf.excludeSkills)
  c += arr(jf.excludeTitle)
  c += arr(jf.cities)
  c += arr(jf.regions)
  c += arr(jf.remote)
  c += arr(jf.experience)
  c += arr(jf.job_slugs)

  if (jf.cityMatch === 'exact') c++
  if (jf.excludeCities) c++
  if (jf.excludeRegions) c++
  if (typeof jf.minTjm === 'number') c++
  if (typeof jf.maxTjm === 'number') c++
  if (jf.startDate) c++
  if (jf.endDate) c++

  return c
}
