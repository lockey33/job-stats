'use client'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import {
  fetchEmergingSkills,
  fetchJobs,
  fetchMeta,
  fetchMetrics,
  fetchTopSkills,
} from '@/features/jobs/api/endpoints'
import type { JobFilters } from '@/features/jobs/types/types'

import { queryKeys } from './queryKeys'

export function useMeta() {
  return useQuery({
    queryKey: queryKeys.meta(),
    queryFn: fetchMeta,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useJobs(params: { page: number; pageSize: number; filters: Partial<JobFilters> }) {
  const { page, pageSize, filters } = params
  return useQuery({
    queryKey: queryKeys.jobs({ page, pageSize, ...filters }),
    queryFn: () => fetchJobs({ ...filters, page, pageSize }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  })
}

export function useMetrics(filters: Partial<JobFilters>, series?: string[]) {
  return useQuery({
    queryKey: queryKeys.metrics({ series: series ?? 'auto', ...filters }),
    queryFn: () => fetchMetrics(filters, series),
  })
}

export function useTopSkills(filters: Partial<JobFilters>) {
  return useQuery({
    queryKey: queryKeys.topSkills({ count: 50, ...filters }),
    queryFn: () => fetchTopSkills(filters, 50),
  })
}

export function useEmerging(
  filters: Partial<JobFilters>,
  topK = 10,
  monthsWindow = 12,
  minTotalCount = 5,
) {
  return useQuery({
    queryKey: queryKeys.emerging({ monthsWindow, topK, minTotalCount, ...filters }),
    queryFn: () => fetchEmergingSkills(filters, monthsWindow, topK, minTotalCount),
  })
}
