import { itemTjmApprox as approx } from '@/features/jobs/utils/common'
import { norm, normCity } from '@/shared/utils/normalize'

import type {
  AnalyticsResult,
  EmergingSkillTrend,
  EmergingSkillTrendPayload,
  JobFilters,
  JobItem,
  MonthlyPoint,
  SkillsSeriesPoint,
  TopSkill,
} from '../types/types'
import { applyFilters, dedupeById } from './filtering'

function monthKey(iso: string | undefined | null): string | null {
  if (!iso) return null
  if (iso.length >= 7) return iso.slice(0, 7)
  return null
}

function linearRegressionSlope(y: number[]): number {
  const n = y.length
  if (n <= 1) return 0
  const xMean = (n - 1) / 2
  const yMean = y.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    const dx = i - xMean
    const yi = y[i] ?? yMean
    num += dx * (yi - yMean)
    den += dx * dx
  }
  return den === 0 ? 0 : num / den
}

export function computeEmergingSkillsTrends(
  allJobs: JobItem[],
  filters: JobFilters,
  monthsWindow = 12,
  topK = 10,
  minTotalCount = 5,
): EmergingSkillTrendPayload {
  const jobs = dedupeById(applyFilters(allJobs, filters))
  const monthSet = new Set<string>()
  const countsByMonth: Record<string, Record<string, number>> = {}
  for (const j of jobs) {
    const m = monthKey(j.created_at)
    if (!m) continue
    monthSet.add(m)
    const skills = j.skills ?? []
    if (!countsByMonth[m]) countsByMonth[m] = {}
    for (const s of skills) {
      if (!s) continue
      countsByMonth[m][s] = (countsByMonth[m][s] ?? 0) + 1
    }
  }
  let months = Array.from(monthSet).sort()
  if (monthsWindow > 0 && months.length > monthsWindow)
    months = months.slice(months.length - monthsWindow)
  const allSkillsSet = new Set<string>()
  const totalInWindow: Record<string, number> = {}
  for (const m of months) {
    const map = countsByMonth[m] || {}
    for (const [s, c] of Object.entries(map)) {
      allSkillsSet.add(s)
      totalInWindow[s] = (totalInWindow[s] ?? 0) + c
    }
  }
  const allSkills = Array.from(allSkillsSet)
  const rankByMonth: Record<string, Record<string, number>> = {}
  for (const m of months) {
    const map = countsByMonth[m] || {}
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1])
    const ranks: Record<string, number> = {}
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]!
      ranks[e[0]] = i + 1
    }
    rankByMonth[m] = ranks
  }
  const defaultRankPerMonth: Record<string, number> = {}
  for (const m of months) defaultRankPerMonth[m] = Object.keys(rankByMonth[m] ?? {}).length + 1
  const trends: EmergingSkillTrend[] = []
  for (const s of allSkills) {
    if ((totalInWindow[s] ?? 0) < minTotalCount) continue
    const y = months.map((m) => rankByMonth[m]?.[s] ?? defaultRankPerMonth[m])
    const monthly = months.map((m, idx) => ({ month: m, rank: y[idx] as number }))
    trends.push({ skill: s, monthly, slope: linearRegressionSlope(y as number[]) })
  }
  trends.sort((a, b) => {
    if (a.slope !== b.slope) return a.slope - b.slope
    const ar = a.monthly.at(-1)?.rank ?? Number.MAX_SAFE_INTEGER
    const br = b.monthly.at(-1)?.rank ?? Number.MAX_SAFE_INTEGER
    return ar - br
  })
  return { months, trends: trends.slice(0, topK) }
}

export function computeTopSkillsTotals(
  allJobs: JobItem[],
  filters: JobFilters,
  topSkillsCount = 50,
): TopSkill[] {
  const jobs = dedupeById(applyFilters(allJobs, filters))
  const totals: Record<string, number> = {}
  for (const j of jobs) for (const s of j.skills ?? []) if (s) totals[s] = (totals[s] ?? 0) + 1
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topSkillsCount)
    .map(([skill, count]) => ({ skill, count }))
}

export interface CitySkillTrendResult {
  months: string[]
  citySeries: Record<string, MonthlyPoint[]>
  topCities: string[]
}

export function computeCitySkillTrend(
  allJobs: JobItem[],
  filters: JobFilters,
  skill: string,
  cities?: string[],
  topCityCount = 5,
): CitySkillTrendResult {
  const skillNorm = norm(skill)
  if (!skillNorm) return { months: [], citySeries: {}, topCities: [] }
  const jobs = dedupeById(applyFilters(allJobs, { ...filters }))
  const monthSet = new Set<string>()
  const cityMonthCounts: Record<string, Record<string, number>> = {}
  const totalsByCity: Record<string, number> = {}
  for (const j of jobs) {
    const mk = j.created_at && j.created_at.length >= 7 ? j.created_at.slice(0, 7) : null
    if (!mk) continue
    monthSet.add(mk)
    const hasSkill = (j.skills ?? []).some((s) => norm(s) === skillNorm)
    if (!hasSkill) continue
    const cityRaw = j.city ?? '—'
    const cityKey =
      cities && cities.length > 0
        ? cities.find((c) => normCity(cityRaw).includes(normCity(c))) || null
        : cityRaw
    if (!cityKey) continue
    if (!cityMonthCounts[cityKey]) cityMonthCounts[cityKey] = {}
    cityMonthCounts[cityKey][mk] = (cityMonthCounts[cityKey][mk] ?? 0) + 1
    totalsByCity[cityKey] = (totalsByCity[cityKey] ?? 0) + 1
  }
  const months = Array.from(monthSet).sort()
  let seriesCities = Object.keys(cityMonthCounts)
  if (!seriesCities.length && cities && cities.length > 0) seriesCities = cities.slice()
  let topCities: string[] = []
  if (!cities || cities.length === 0) {
    topCities = Object.entries(totalsByCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topCityCount)
      .map(([city]) => city)
    seriesCities = topCities
  } else {
    topCities = Object.entries(totalsByCity)
      .sort((a, b) => b[1] - a[1])
      .map(([city]) => city)
  }
  const citySeries: Record<string, MonthlyPoint[]> = {}
  for (const city of seriesCities) {
    const counts = cityMonthCounts[city] ?? {}
    citySeries[city] = months.map((m) => ({ month: m, value: counts[m] ?? 0 }))
  }
  return { months, citySeries, topCities }
}

function itemTjmApprox(item: JobItem): number | null {
  return approx(item.min_tjm, item.max_tjm)
}

export function computeMetrics(
  allJobs: JobItem[],
  filters: JobFilters,
  topSkillsCount = 10,
  seriesOverride?: string[],
): AnalyticsResult {
  const jobs = dedupeById(applyFilters(allJobs, filters))
  const monthSet = new Set<string>()
  const tjmByMonth: Record<string, { sum: number; count: number }> = {}
  const postingsByMonth: Record<string, number> = {}
  const skillTotals: Record<string, number> = {}
  const skillsByMonth: Record<string, Record<string, number>> = {}
  for (const j of jobs) {
    const mk = monthKey(j.created_at)
    if (!mk) continue
    monthSet.add(mk)
    postingsByMonth[mk] = (postingsByMonth[mk] ?? 0) + 1
    const tjm = itemTjmApprox(j)
    if (tjm != null) {
      if (!tjmByMonth[mk]) tjmByMonth[mk] = { sum: 0, count: 0 }
      tjmByMonth[mk].sum += tjm
      tjmByMonth[mk].count += 1
    }
    for (const s of j.skills ?? []) {
      if (!s) continue
      skillTotals[s] = (skillTotals[s] ?? 0) + 1
      if (!skillsByMonth[mk]) skillsByMonth[mk] = {}
      skillsByMonth[mk][s] = (skillsByMonth[mk][s] ?? 0) + 1
    }
  }
  const months = Array.from(monthSet).sort()
  const postingsPerMonth: MonthlyPoint[] = months.map((m) => ({
    month: m,
    value: postingsByMonth[m] ?? 0,
  }))
  const avgTjmPerMonth: MonthlyPoint[] = months.map((m) => {
    const e = tjmByMonth[m]
    const v = e && e.count > 0 ? e.sum / e.count : 0
    return { month: m, value: Number(v.toFixed(2)) }
  })
  const topSkills = Object.entries(skillTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topSkillsCount)
    .map(([s]) => s)
  const seriesSkills =
    seriesOverride && seriesOverride.length > 0 ? Array.from(new Set(seriesOverride)) : topSkills
  const skillsPerMonth: SkillsSeriesPoint[] = months.map((m) => {
    const row: SkillsSeriesPoint = { month: m }
    for (const s of seriesSkills) row[s] = skillsByMonth[m]?.[s] ?? 0
    return row
  })
  return { months, postingsPerMonth, avgTjmPerMonth, topSkills, seriesSkills, skillsPerMonth }
}
