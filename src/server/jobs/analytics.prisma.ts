import 'server-only'

import { Prisma } from '@prisma/client'

import type {
  AnalyticsResult,
  EmergingSkillTrend,
  EmergingSkillTrendPayload,
  JobFilters,
  MonthlyPoint,
  SkillsSeriesPoint,
  TopSkill,
} from '@/features/jobs/types/types'
import { getPrisma, isSchemaMissingError } from '@/server/db/prisma'

// Build WHERE clauses as Prisma.Sql fragments, qualified with a table alias (Postgres only)
function buildWhereClauses(filters: JobFilters, alias = 'Job'): Prisma.Sql[] {
  const A = (col: string) => Prisma.raw(`"${alias}"."${col}"`)
  const clauses: Prisma.Sql[] = []
  const approx = Prisma.sql`COALESCE((${A('minTjm')} + ${A('maxTjm')})/2.0, ${A('minTjm')}, ${A('maxTjm')})`

  // free text
  if (filters.q && filters.q.trim()) {
    const p = `%${filters.q.trim().toLowerCase()}%`
    clauses.push(
      Prisma.sql`(
        LOWER(COALESCE(${A('title')}, '')) LIKE ${p} OR
        LOWER(COALESCE(${A('companyName')}, '')) LIKE ${p} OR
        LOWER(COALESCE(${A('city')}, '')) LIKE ${p} OR
        LOWER(COALESCE(${A('description')}, '')) LIKE ${p} OR
        LOWER(COALESCE(${A('candidateProfile')}, '')) LIKE ${p} OR
        LOWER(COALESCE(${A('companyDescription')}, '')) LIKE ${p}
      )`,
    )
  }

  // cities
  const cities = (filters.cities ?? []).filter(Boolean)
  if (cities.length > 0) {
    if (filters.cityMatch === 'exact') {
      const inner = Prisma.sql`${A('city')} IN (${Prisma.join(cities)})`
      clauses.push(filters.excludeCities ? Prisma.sql`NOT (${inner})` : inner)
    } else {
      const ors = cities.map((c) => Prisma.sql`${A('city')} LIKE ${`%${c}%`}`)
      const inner = Prisma.sql`(${Prisma.join(ors, ' OR ')})`
      clauses.push(filters.excludeCities ? Prisma.sql`NOT ${inner}` : inner)
    }
  }

  // regions
  const regions = (filters.regions ?? []).filter(Boolean)
  if (regions.length > 0) {
    const inner = Prisma.sql`${A('region')} IN (${Prisma.join(regions)})`
    clauses.push(filters.excludeRegions ? Prisma.sql`NOT (${inner})` : inner)
  }

  // remote
  const remote = (filters.remote ?? []).filter(Boolean)
  if (remote.length > 0) clauses.push(Prisma.sql`${A('remote')} IN (${Prisma.join(remote)})`)

  // experience
  const exp = (filters.experience ?? []).filter(Boolean)
  if (exp.length > 0) clauses.push(Prisma.sql`${A('experience')} IN (${Prisma.join(exp)})`)

  // job slugs
  const slugs = (filters.job_slugs ?? []).filter(Boolean)
  if (slugs.length > 0) clauses.push(Prisma.sql`${A('jobSlug')} IN (${Prisma.join(slugs)})`)

  // title exclusions
  const excludeTitle = (filters.excludeTitle ?? []).filter(Boolean)
  for (const w of excludeTitle) clauses.push(Prisma.sql`${A('title')} NOT LIKE ${`%${w}%`}`)

  // dates
  if (filters.startDate)
    clauses.push(Prisma.sql`${A('createdAt')} >= ${new Date(filters.startDate)}`)
  if (filters.endDate) clauses.push(Prisma.sql`${A('createdAt')} <= ${new Date(filters.endDate)}`)

  // TJM approx
  if (typeof filters.minTjm === 'number') clauses.push(Prisma.sql`${approx} >= ${filters.minTjm}`)
  if (typeof filters.maxTjm === 'number') clauses.push(Prisma.sql`${approx} <= ${filters.maxTjm}`)

  // skills: require ALL listed hard skills
  const mustSkills = (filters.skills ?? []).filter(Boolean)
  for (const s of mustSkills) {
    clauses.push(
      Prisma.sql`EXISTS (SELECT 1 FROM "JobSkill" js INNER JOIN "Skill" sk ON sk.id = js."skillId" WHERE js."jobId" = ${A('id')} AND js.kind = 'HARD' AND sk.name = ${s})`,
    )
  }
  // excludeSkills: require none
  const notSkills = (filters.excludeSkills ?? []).filter(Boolean)
  for (const s of notSkills) {
    clauses.push(
      Prisma.sql`NOT EXISTS (SELECT 1 FROM "JobSkill" js INNER JOIN "Skill" sk ON sk.id = js."skillId" WHERE js."jobId" = ${A('id')} AND sk.name = ${s})`,
    )
  }

  return clauses
}

export async function getTopSkillsDb(
  filters: JobFilters,
  topSkillsCount = 50,
): Promise<TopSkill[]> {
  let prisma: Awaited<ReturnType<typeof getPrisma>>
  try {
    prisma = await getPrisma()
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e)) return []
    throw e
  }
  const base = buildWhereClauses(filters, 'Job')
  const where = [...base, Prisma.sql`js.kind = 'HARD'`]
  const whereSql = where.length ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.sql``
  let rows: Array<{ skill: string; cnt: number }> = []
  try {
    rows = await prisma.$queryRaw<Array<{ skill: string; cnt: number }>>(Prisma.sql`
      SELECT sk.name AS skill, COUNT(*) AS cnt
      FROM "JobSkill" js
      JOIN "Job" Job ON Job.id = js."jobId"
      JOIN "Skill" sk ON sk.id = js."skillId"
      ${whereSql}
      GROUP BY sk.name
      ORDER BY cnt DESC
      LIMIT ${Number(topSkillsCount) || 50}
    `)
  } catch (e) {
    if (!isSchemaMissingError(e)) throw e
    if (process.env.NODE_ENV === 'production') throw e
    rows = []
  }
  return rows.map((r) => ({ skill: r.skill, count: Number(r.cnt) }))
}

export async function getMetricsDb(
  filters: JobFilters,
  topSkillsCount = 10,
  seriesOverride?: string[],
): Promise<AnalyticsResult> {
  let prisma: Awaited<ReturnType<typeof getPrisma>>
  try {
    prisma = await getPrisma()
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e))
      return {
        months: [],
        postingsPerMonth: [],
        avgTjmPerMonth: [],
        topSkills: [],
        seriesSkills: [],
        skillsPerMonth: [],
      }
    throw e
  }
  const baseClauses = buildWhereClauses(filters, 'Job')
  const whereSql = baseClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(baseClauses, ' AND ')}`
    : Prisma.sql``

  // postings per month (YYYY-MM)
  const mExpr = `to_char("createdAt", 'YYYY-MM')`
  let postingsRaw: Array<{ m: string; c: number }>
  try {
    postingsRaw = await prisma.$queryRaw<Array<{ m: string; c: number }>>(Prisma.sql`
      SELECT ${Prisma.raw(mExpr)} AS m, COUNT(*) AS c FROM "Job" Job ${whereSql} GROUP BY m ORDER BY m
    `)
  } catch (e) {
    if (!isSchemaMissingError(e)) throw e
    if (process.env.NODE_ENV === 'production') throw e
    postingsRaw = []
  }
  const postings = postingsRaw.map((r) => ({ m: String(r.m).slice(0, 7), c: Number(r.c) }))

  // avg TJM per month
  let avgRaw: Array<{ m: string; v: number }>
  try {
    avgRaw = await prisma.$queryRaw<Array<{ m: string; v: number }>>(Prisma.sql`
      SELECT ${Prisma.raw(mExpr)} AS m,
             AVG(COALESCE(("minTjm" + "maxTjm")/2.0, "minTjm", "maxTjm")) AS v
      FROM "Job" Job ${whereSql}
      GROUP BY m
      ORDER BY m
    `)
  } catch (e) {
    if (!isSchemaMissingError(e)) throw e
    if (process.env.NODE_ENV === 'production') throw e
    avgRaw = []
  }
  const avg = avgRaw.map((r) => ({ m: String(r.m).slice(0, 7), v: Number(r.v) }))

  // (Postgres only; no engine fallback)

  // top skills
  const topSkills =
    seriesOverride && seriesOverride.length > 0
      ? Array.from(new Set(seriesOverride))
      : (await getTopSkillsDb(filters, topSkillsCount)).map((t) => t.skill)

  // skills per month for selected series
  const seriesList = topSkills.length > 0 ? topSkills : []
  let skillsCounts: Array<{ m: string; skill: string; c: number }> = []
  if (seriesList.length > 0) {
    const jmExpr = `to_char(j."createdAt", 'YYYY-MM')`
    const baseJ = buildWhereClauses(filters, 'j')
    const whereJ = [
      ...baseJ,
      Prisma.sql`js.kind = 'HARD'`,
      Prisma.sql`sk.name IN (${Prisma.join(seriesList)})`,
    ]
    const whereJSql = whereJ.length
      ? Prisma.sql`WHERE ${Prisma.join(whereJ, ' AND ')}`
      : Prisma.sql``
    let skillsCountsRaw: Array<{ m: string; skill: string; c: number }>
    try {
      skillsCountsRaw = await prisma.$queryRaw<
        Array<{ m: string; skill: string; c: number }>
      >(Prisma.sql`
        SELECT ${Prisma.raw(jmExpr)} AS m, sk.name AS skill, COUNT(*) AS c
        FROM "JobSkill" js
        JOIN "Job" j ON j.id = js."jobId"
        JOIN "Skill" sk ON sk.id = js."skillId"
        ${whereJSql}
        GROUP BY m, skill
        ORDER BY m
      `)
    } catch (e) {
      if (!isSchemaMissingError(e)) throw e
      if (process.env.NODE_ENV === 'production') throw e
      skillsCountsRaw = []
    }
    skillsCounts = skillsCountsRaw.map((r) => ({
      m: String(r.m).slice(0, 7),
      skill: r.skill,
      c: Number(r.c),
    }))
  }

  // Build month axis
  const monthSet = new Set<string>([...postings.map((r) => r.m), ...avg.map((r) => r.m)])
  const months = Array.from(monthSet).sort()

  const postingsPerMonth: MonthlyPoint[] = months.map((m) => ({
    month: m,
    value: Number(postings.find((r) => r.m === m)?.c ?? 0),
  }))

  const avgTjmPerMonth: MonthlyPoint[] = months.map((m) => ({
    month: m,
    value: Number((avg.find((r) => r.m === m)?.v ?? 0).toFixed(2)),
  }))

  const seriesSkills = seriesList
  const skillsPerMonth: SkillsSeriesPoint[] = months.map((m) => {
    const row: SkillsSeriesPoint = { month: m }
    for (const s of seriesSkills) {
      const found = skillsCounts.find((r) => r.m === m && r.skill === s)
      row[s] = Number(found?.c ?? 0)
    }
    return row
  })

  return { months, postingsPerMonth, avgTjmPerMonth, topSkills, seriesSkills, skillsPerMonth }
}

export async function getEmergingDb(
  filters: JobFilters,
  monthsWindow = 12,
  topK = 10,
  minTotalCount = 5,
): Promise<EmergingSkillTrendPayload> {
  let prisma: Awaited<ReturnType<typeof getPrisma>>
  try {
    prisma = await getPrisma()
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e))
      return { months: [], trends: [] }
    throw e
  }
  const jmExpr = `to_char(j."createdAt", 'YYYY-MM')`
  const baseJ = buildWhereClauses(filters, 'j')
  const whereJ = [...baseJ, Prisma.sql`js.kind = 'HARD'`]
  const whereJSql = whereJ.length ? Prisma.sql`WHERE ${Prisma.join(whereJ, ' AND ')}` : Prisma.sql``
  let rows: Array<{ m: string; skill: string; c: number }>
  try {
    rows = await prisma.$queryRaw<Array<{ m: string; skill: string; c: number }>>(Prisma.sql`
      SELECT ${Prisma.raw(jmExpr)} AS m, sk.name AS skill, COUNT(*) AS c
      FROM "JobSkill" js
      JOIN "Job" j ON j.id = js."jobId"
      JOIN "Skill" sk ON sk.id = js."skillId"
      ${whereJSql}
      GROUP BY m, skill
      ORDER BY m
    `)
  } catch (e) {
    if (!isSchemaMissingError(e)) throw e
    if (process.env.NODE_ENV === 'production') throw e
    rows = []
  }

  // Normalize months to 'YYYY-MM' and counts to numbers
  const rowsNorm = rows.map((r) => ({ m: String(r.m).slice(0, 7), skill: r.skill, c: Number(r.c) }))

  // Build monthly matrices
  const monthSet = new Set<string>(rowsNorm.map((r) => r.m))
  let months = Array.from(monthSet).sort()
  if (monthsWindow > 0 && months.length > monthsWindow)
    months = months.slice(months.length - monthsWindow)

  const countsByMonth: Record<string, Record<string, number>> = {}
  const totalInWindow: Record<string, number> = {}
  for (const r of rowsNorm) {
    if (!months.includes(r.m)) continue
    countsByMonth[r.m] = countsByMonth[r.m] || {}
    const map = countsByMonth[r.m] as Record<string, number>
    map[r.skill] = (map[r.skill] ?? 0) + Number(r.c)
    totalInWindow[r.skill] = (totalInWindow[r.skill] ?? 0) + Number(r.c)
  }

  // Compute ranks per month
  const rankByMonth: Record<string, Record<string, number>> = {}
  for (const m of months) {
    const entries = Object.entries(countsByMonth[m] || {}).sort((a, b) => b[1] - a[1])
    const ranks: Record<string, number> = {}
    for (let i = 0; i < entries.length; i++) ranks[entries[i]![0]] = i + 1
    rankByMonth[m] = ranks
  }
  const defaultRankPerMonth: Record<string, number> = {}
  for (const m of months) defaultRankPerMonth[m] = Object.keys(rankByMonth[m] ?? {}).length + 1

  function slope(y: number[]): number {
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

  const skills = Object.keys(totalInWindow).filter((s) => totalInWindow[s]! >= minTotalCount)
  const trends: EmergingSkillTrend[] = []
  for (const s of skills) {
    const y = months.map((m) => rankByMonth[m]?.[s] ?? defaultRankPerMonth[m])
    const monthly = months.map((m, idx) => ({ month: m, rank: y[idx] as number }))
    trends.push({ skill: s, monthly, slope: slope(y as number[]) })
  }
  trends.sort((a, b) => {
    if (a.slope !== b.slope) return a.slope - b.slope
    const ar = a.monthly.at(-1)?.rank ?? Number.MAX_SAFE_INTEGER
    const br = b.monthly.at(-1)?.rank ?? Number.MAX_SAFE_INTEGER
    return ar - br
  })
  return { months, trends: trends.slice(0, topK) }
}

export async function getCitySkillTrendDb(
  filters: JobFilters,
  skill: string,
  seriesCities?: string[],
  topCityCount = 5,
) {
  let prisma: Awaited<ReturnType<typeof getPrisma>>
  try {
    prisma = await getPrisma()
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e))
      return { months: [], citySeries: {}, topCities: [] }
    throw e
  }
  const baseJ = buildWhereClauses(filters, 'j')
  const jcExpr = `to_char(j."createdAt", 'YYYY-MM')`
  const whereJ = [
    ...baseJ,
    Prisma.sql`js.kind = 'HARD'`,
    Prisma.sql`LOWER(sk.name) = ${skill.toLowerCase()}`,
  ]
  const whereJSql = whereJ.length ? Prisma.sql`WHERE ${Prisma.join(whereJ, ' AND ')}` : Prisma.sql``
  let rowsCity: Array<{ m: string; city: string | null; c: number }>
  try {
    rowsCity = await prisma.$queryRaw<
      Array<{ m: string; city: string | null; c: number }>
    >(Prisma.sql`
      SELECT ${Prisma.raw(jcExpr)} AS m, COALESCE(j.city, '—') AS city, COUNT(*) AS c
      FROM "JobSkill" js
      JOIN "Job" j ON j.id = js."jobId"
      JOIN "Skill" sk ON sk.id = js."skillId"
      ${whereJSql}
      GROUP BY m, city
      ORDER BY m
    `)
  } catch (e) {
    if (!isSchemaMissingError(e)) throw e
    if (process.env.NODE_ENV === 'production') throw e
    rowsCity = []
  }

  const rowsCityNorm = rowsCity.map((r) => ({
    m: String(r.m).slice(0, 7),
    city: r.city ?? '—',
    c: Number(r.c),
  }))

  const monthSet = new Set<string>(rowsCityNorm.map((r) => r.m))
  const months = Array.from(monthSet).sort()
  const cityMonthCounts: Record<string, Record<string, number>> = {}
  const totalsByCity: Record<string, number> = {}
  for (const r of rowsCityNorm) {
    const city = r.city
    cityMonthCounts[city] = cityMonthCounts[city] || {}
    cityMonthCounts[city][r.m] = Number(r.c)
    totalsByCity[city] = (totalsByCity[city] ?? 0) + Number(r.c)
  }
  let list = Object.keys(cityMonthCounts)
  let topCities: string[] = []
  if (seriesCities && seriesCities.length > 0) {
    list = seriesCities
    topCities = Object.entries(totalsByCity)
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c)
  } else {
    topCities = Object.entries(totalsByCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topCityCount)
      .map(([c]) => c)
    list = topCities
  }
  const citySeries: Record<string, MonthlyPoint[]> = {}
  for (const city of list) {
    const map = cityMonthCounts[city] || {}
    citySeries[city] = months.map((m) => ({ month: m, value: map[m] ?? 0 }))
  }
  return { months, citySeries, topCities }
}
