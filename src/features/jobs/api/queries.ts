import type { UseQueryOptions } from '@tanstack/react-query'

import {
  fetchEmergingSkills,
  fetchJobs,
  fetchMeta,
  fetchMetrics,
  fetchTopSkills,
} from '@/features/jobs/api/endpoints'
import { queryKeys } from '@/features/jobs/api/queryKeys'
import type {
  AnalyticsResult,
  EmergingSkillTrendPayload,
  JobFilters,
  JobsResult,
  TopSkill,
} from '@/features/jobs/types/types'

export function metaQuery(): UseQueryOptions<Awaited<ReturnType<typeof fetchMeta>>, Error> {
  return {
    queryKey: queryKeys.meta(),
    queryFn: fetchMeta,
    staleTime: Infinity,
    gcTime: Infinity,
  }
}

export function jobsQuery(params: {
  page: number
  pageSize: number
  filters: Partial<JobFilters>
}): UseQueryOptions<JobsResult, Error> {
  const { page, pageSize, filters } = params

  return {
    queryKey: queryKeys.jobs({ page, pageSize, ...filters }),
    queryFn: () => fetchJobs({ ...filters, page, pageSize }),
  }
}

export function metricsQuery(
  filters: Partial<JobFilters>,
  seriesSkills?: string[],
  topSkillsCount = 10,
): UseQueryOptions<AnalyticsResult, Error> {
  return {
    queryKey: queryKeys.metrics({ series: seriesSkills ?? 'auto', ...filters }),
    queryFn: () => fetchMetrics(filters, seriesSkills, topSkillsCount),
  }
}

export function topSkillsQuery(
  filters: Partial<JobFilters>,
  count = 50,
): UseQueryOptions<TopSkill[], Error> {
  return {
    queryKey: queryKeys.topSkills({ count, ...filters }),
    queryFn: () => fetchTopSkills(filters, count),
  }
}

export function emergingQuery(
  filters: Partial<JobFilters>,
  monthsWindow = 12,
  topK = 10,
  minTotalCount = 5,
): UseQueryOptions<EmergingSkillTrendPayload, Error> {
  return {
    queryKey: queryKeys.emerging({ monthsWindow, topK, minTotalCount, ...filters }),
    queryFn: () => fetchEmergingSkills(filters, monthsWindow, topK, minTotalCount),
  }
}
