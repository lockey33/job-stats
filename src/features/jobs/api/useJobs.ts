'use client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { JobFilters } from '@/features/jobs/types/types'

import { emergingQuery, jobsQuery, metaQuery, metricsQuery, topSkillsQuery } from './queries'

export function useMeta() {
  return useQuery(metaQuery())
}

export function useJobs(params: { page: number; pageSize: number; filters: Partial<JobFilters> }) {
  const { page, pageSize, filters } = params
  return useQuery({
    ...jobsQuery({ page, pageSize, filters }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  })
}

export function useMetrics(filters: Partial<JobFilters>, series?: string[]) {
  return useQuery({
    ...metricsQuery(filters, series),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  })
}

export function useTopSkills(filters: Partial<JobFilters>) {
  return useQuery({
    ...topSkillsQuery(filters, 50),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  })
}

export function useEmerging(
  filters: Partial<JobFilters>,
  topK = 10,
  monthsWindow = 12,
  minTotalCount = 5,
) {
  return useQuery({
    ...emergingQuery(filters, monthsWindow, topK, minTotalCount),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  })
}
