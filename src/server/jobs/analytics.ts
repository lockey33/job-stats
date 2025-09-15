import 'server-only'

import type {
  AnalyticsResult,
  EmergingSkillTrendPayload,
  JobFilters,
  TopSkill,
} from '@/features/jobs/types/types'
import {
  computeEmergingSkillsTrends,
  computeMetrics,
  computeTopSkillsTotals,
} from '@/features/jobs/utils/metrics'
import { stableStringify } from '@/shared/utils/stableStringify'

import { getAllJobs, getDatasetVersion } from './repository'

type CacheEntry<T> = { version: string; key: string; value: T }

const metricsCache = new Map<string, CacheEntry<AnalyticsResult>>()
const topSkillsCache = new Map<string, CacheEntry<TopSkill[]>>()
const emergingCache = new Map<string, CacheEntry<EmergingSkillTrendPayload>>()

// moved to shared/utils/stableStringify

async function ensureJobsWithVersion() {
  const [version, jobs] = await Promise.all([getDatasetVersion(), getAllJobs()])
  return { version, jobs } as const
}

export async function getMetricsCached(
  filters: JobFilters,
  topSkillsCount = 10,
  seriesOverride?: string[],
): Promise<AnalyticsResult> {
  const { version, jobs } = await ensureJobsWithVersion()
  const key = version + '|' + stableStringify({ filters, topSkillsCount, series: seriesOverride })
  const hit = metricsCache.get(key)
  if (hit && hit.version === version) return hit.value
  const value = computeMetrics(jobs, filters, topSkillsCount, seriesOverride)
  metricsCache.set(key, { version, key, value })
  return value
}

export async function getTopSkillsCached(
  filters: JobFilters,
  topSkillsCount = 50,
): Promise<TopSkill[]> {
  const { version, jobs } = await ensureJobsWithVersion()
  const key = version + '|' + stableStringify({ filters, topSkillsCount })
  const hit = topSkillsCache.get(key)
  if (hit && hit.version === version) return hit.value
  const value = computeTopSkillsTotals(jobs, filters, topSkillsCount)
  topSkillsCache.set(key, { version, key, value })
  return value
}

export async function getEmergingCached(
  filters: JobFilters,
  monthsWindow = 12,
  topK = 10,
  minTotalCount = 5,
): Promise<EmergingSkillTrendPayload> {
  const { version, jobs } = await ensureJobsWithVersion()
  const key = version + '|' + stableStringify({ filters, monthsWindow, topK, minTotalCount })
  const hit = emergingCache.get(key)
  if (hit && hit.version === version) return hit.value
  const value = computeEmergingSkillsTrends(jobs, filters, monthsWindow, topK, minTotalCount)
  emergingCache.set(key, { version, key, value })
  return value
}

export function clearAnalyticsCaches() {
  metricsCache.clear()
  topSkillsCache.clear()
  emergingCache.clear()
}
