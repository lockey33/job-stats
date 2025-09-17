import 'server-only'

import type { FetchQueryOptions } from '@tanstack/react-query'

import type {
  AnalyticsResult,
  EmergingSkillTrendPayload,
  JobFilters,
  JobsResult,
  TopSkill,
} from '@/features/jobs/types/types'
import { applyFilters, dedupeById, paginate } from '@/features/jobs/utils/filtering'
import { getEmergingCached, getMetricsCached, getTopSkillsCached } from '@/server/jobs/analytics'
import { getMetaFacets } from '@/server/jobs/facets'
import { getAllJobs } from '@/server/jobs/repository'
import { queryKeys } from '@/features/jobs/api/queryKeys'

export function metaQuery(): FetchQueryOptions<
  Awaited<ReturnType<typeof getMetaFacets>>,
  Error,
  Awaited<ReturnType<typeof getMetaFacets>>
> {
  return {
    queryKey: queryKeys.meta(),
    queryFn: () => getMetaFacets(),
    staleTime: Infinity,
    gcTime: Infinity,
  }
}

export function jobsQuery(params: {
  page: number
  pageSize: number
  filters: Partial<JobFilters>
}): FetchQueryOptions<JobsResult, Error, JobsResult> {
  const { page, pageSize, filters } = params
  return {
    queryKey: queryKeys.jobs({ page, pageSize, ...filters }),
    queryFn: async () => {
      const jobsAll = await getAllJobs()
      const filtered = dedupeById(applyFilters(jobsAll, filters as JobFilters))
      const sorted = filtered
        .slice()
        .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
      return paginate(sorted, { page, pageSize })
    },
  }
}

export function metricsQuery(
  filters: Partial<JobFilters>,
  seriesSkills?: string[],
  topSkillsCount = 10,
): FetchQueryOptions<AnalyticsResult, Error, AnalyticsResult> {
  return {
    queryKey: queryKeys.metrics({ series: seriesSkills ?? 'auto', ...filters }),
    queryFn: () => getMetricsCached(filters as JobFilters, topSkillsCount, seriesSkills),
  }
}

export function topSkillsQuery(
  filters: Partial<JobFilters>,
  count = 50,
): FetchQueryOptions<TopSkill[], Error, TopSkill[]> {
  return {
    queryKey: queryKeys.topSkills({ count, ...filters }),
    queryFn: () => getTopSkillsCached(filters as JobFilters, count),
  }
}

export function emergingQuery(
  filters: Partial<JobFilters>,
  monthsWindow = 12,
  topK = 10,
  minTotalCount = 5,
): FetchQueryOptions<EmergingSkillTrendPayload, Error, EmergingSkillTrendPayload> {
  return {
    queryKey: queryKeys.emerging({ monthsWindow, topK, minTotalCount, ...filters }),
    queryFn: () => getEmergingCached(filters as JobFilters, monthsWindow, topK, minTotalCount),
  }
}
