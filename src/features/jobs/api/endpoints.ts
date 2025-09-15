import type {
  AnalyticsResult,
  EmergingSkillTrendPayload,
  JobFilters,
  JobsResult,
  MetaFacets,
  TopSkill,
} from '@/features/jobs/types/types'
import { apiGet, buildQueryFromFilters } from '@/shared/http/client'

export async function fetchJobs(
  filters: Partial<JobFilters & { page: number; pageSize: number }>,
): Promise<JobsResult> {
  const query = buildQueryFromFilters(filters)
  return apiGet('/api/jobs', query)
}

export async function fetchMeta(): Promise<MetaFacets> {
  return apiGet('/api/meta')
}

export async function fetchMetrics(
  filters: Partial<JobFilters> = {},
  seriesSkills?: string[],
  topSkillsCount?: number,
): Promise<AnalyticsResult> {
  const query = buildQueryFromFilters(filters, {
    seriesSkills: seriesSkills && seriesSkills.length > 0 ? seriesSkills.join(',') : undefined,
    topSkillsCount,
  })
  return apiGet('/api/metrics', query)
}

export async function fetchTopSkills(
  filters: Partial<JobFilters> = {},
  count = 50,
): Promise<TopSkill[]> {
  const query = buildQueryFromFilters(filters, { count })
  const data = await apiGet<{ topSkills: TopSkill[] }>('/api/metrics/top-skills', query)
  return data.topSkills
}

export interface CitySkillTrendPayload {
  months: string[]
  citySeries: Record<string, { month: string; value: number }[]>
  topCities: string[]
}

export async function fetchEmergingSkills(
  filters: Partial<JobFilters> = {},
  monthsWindow = 12,
  topK = 10,
  minTotalCount = 5,
): Promise<EmergingSkillTrendPayload> {
  const query = buildQueryFromFilters(filters, {
    monthsWindow,
    topK,
    minTotalCount,
  })
  return apiGet('/api/metrics/emerging-skills', query)
}

export async function fetchCitySkillTrend(
  filters: Partial<JobFilters> = {},
  skill: string,
  seriesCities?: string[],
  topCityCount?: number,
): Promise<CitySkillTrendPayload> {
  const query = buildQueryFromFilters(filters, {
    skill,
    seriesCities: seriesCities && seriesCities.length > 0 ? seriesCities.join(',') : undefined,
    topCityCount,
  })
  return apiGet('/api/metrics/city-skill', query)
}
