import type { JobFilters } from '@/features/jobs/types/types'

function uniqTrim(xs: (string | undefined | null)[] | undefined): string[] {
  if (!xs) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const v of xs) {
    const s = String(v ?? '').trim()
    if (!s) continue
    if (!seen.has(s)) {
      seen.add(s)
      out.push(s)
    }
  }
  return out
}

export type NormalizedJobFilters = Omit<JobFilters, 'skills' | 'excludeSkills' | 'excludeTitle' | 'cities' | 'regions' | 'remote' | 'experience' | 'job_slugs'> & {
  skills: string[]
  excludeSkills: string[]
  excludeTitle: string[]
  cities: string[]
  regions: string[]
  remote: string[]
  experience: string[]
  job_slugs: string[]
  cityMatch: 'contains' | 'exact'
}

export function normalizeJobFilters(f: JobFilters | undefined): NormalizedJobFilters {
  const filters = f ?? {}
  const q = (filters.q || '').trim()
  const cityMatch = filters.cityMatch === 'exact' ? 'exact' : 'contains'
  const minTjm = typeof filters.minTjm === 'number' ? filters.minTjm : undefined
  const maxTjm = typeof filters.maxTjm === 'number' ? filters.maxTjm : undefined
  const startDate = filters.startDate && String(filters.startDate).trim() ? String(filters.startDate) : undefined
  const endDate = filters.endDate && String(filters.endDate).trim() ? String(filters.endDate) : undefined

  const out: NormalizedJobFilters = {
    q,
    skills: uniqTrim(filters.skills),
    excludeSkills: uniqTrim(filters.excludeSkills),
    excludeTitle: uniqTrim(filters.excludeTitle),
    cities: uniqTrim(filters.cities),
    regions: uniqTrim(filters.regions),
    remote: uniqTrim(filters.remote),
    experience: uniqTrim(filters.experience),
    job_slugs: uniqTrim(filters.job_slugs),
    cityMatch,
    excludeCities: Boolean(filters.excludeCities),
    excludeRegions: Boolean(filters.excludeRegions),
  }
  if (typeof minTjm === 'number') out.minTjm = minTjm
  if (typeof maxTjm === 'number') out.maxTjm = maxTjm
  if (startDate !== undefined) out.startDate = startDate
  if (endDate !== undefined) out.endDate = endDate

  return out
}

