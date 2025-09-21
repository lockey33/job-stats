import 'server-only'

import type { FetchQueryOptions } from '@tanstack/react-query'

import { queryKeys } from '@/features/jobs/api/queryKeys'
import type {
  AnalyticsResult,
  EmergingSkillTrendPayload,
  JobFilters,
  JobsResult,
  TopSkill,
} from '@/features/jobs/types/types'
import { getEmergingDb } from '@/server/jobs/analytics/emerging'
import { getMetricsDb } from '@/server/jobs/analytics/metrics'
import { getTopSkillsDb } from '@/server/jobs/analytics/topSkills'
import { getMetaFacetsDb, queryJobsDb } from '@/server/jobs/repository'

export function metaQuery(): FetchQueryOptions<
  Awaited<ReturnType<typeof getMetaFacetsDb>>,
  Error,
  Awaited<ReturnType<typeof getMetaFacetsDb>>
> {
  return {
    queryKey: queryKeys.meta(),
    queryFn: () => getMetaFacetsDb(),
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
      return queryJobsDb(filters as JobFilters, { page, pageSize })
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
    queryFn: () => getMetricsDb(filters as JobFilters, topSkillsCount, seriesSkills),
  }
}

export function topSkillsQuery(
  filters: Partial<JobFilters>,
  count = 50,
): FetchQueryOptions<TopSkill[], Error, TopSkill[]> {
  return {
    queryKey: queryKeys.topSkills({ count, ...filters }),
    queryFn: () => getTopSkillsDb(filters as JobFilters, count),
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
    queryFn: () => getEmergingDb(filters as JobFilters, monthsWindow, topK, minTotalCount),
  }
}
