import 'server-only'

import { Prisma } from '@prisma/client'

import type {
  AnalyticsResult,
  JobFilters,
  MonthlyPoint,
  SkillsSeriesPoint,
} from '@/features/jobs/types/types'
import { getPrisma, isSchemaMissingError } from '@/server/db/client'
import { normalizeJobFilters } from '@/server/db/filters/jobFilters'
import {
  buildTextSearchCTE,
  compileJobSqlWhere,
  textSearchJoin,
} from '@/server/db/filters/queryCompiler'
import { getTopSkillsDb } from '@/server/jobs/analytics/topSkills'

export async function getMetricsDb(
  filters: JobFilters,
  topSkillsCount = 10,
  seriesOverride?: string[],
): Promise<AnalyticsResult> {
  const nf = normalizeJobFilters(filters)
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

  const base = compileJobSqlWhere(nf, 'j')
  const cte = buildTextSearchCTE(nf, 'q')
  const joinQ = textSearchJoin(nf, 'j', 'q')
  const whereSql = base.length ? Prisma.sql`WHERE ${Prisma.join(base, ' AND ')}` : Prisma.sql``

  const mExpr = `to_char("createdAt", 'YYYY-MM')`
  let postingsRaw: Array<{ m: string; c: number }>

  try {
    postingsRaw = await prisma.$queryRaw<Array<{ m: string; c: number }>>(Prisma.sql`
      ${cte}
      SELECT ${Prisma.raw(mExpr)} AS m, COUNT(*) AS c
      FROM "Job" j
      ${joinQ}
      ${whereSql}
      GROUP BY m ORDER BY m
    `)
  } catch (e) {
    if (!isSchemaMissingError(e)) throw e
    if (process.env.NODE_ENV === 'production') throw e
    postingsRaw = []
  }

  const postings = postingsRaw.map((r) => ({ m: String(r.m).slice(0, 7), c: Number(r.c) }))

  let avgRaw: Array<{ m: string; v: number }>

  try {
    avgRaw = await prisma.$queryRaw<Array<{ m: string; v: number }>>(Prisma.sql`
      ${cte}
      SELECT ${Prisma.raw(mExpr)} AS m,
             AVG(COALESCE(("minTjm" + "maxTjm")/2.0, "minTjm", "maxTjm")) AS v
      FROM "Job" j
      ${joinQ}
      ${whereSql}
      GROUP BY m
      ORDER BY m
    `)
  } catch (e) {
    if (!isSchemaMissingError(e)) throw e
    if (process.env.NODE_ENV === 'production') throw e
    avgRaw = []
  }

  const avg = avgRaw.map((r) => ({ m: String(r.m).slice(0, 7), v: Number(r.v) }))

  const topSkills =
    seriesOverride && seriesOverride.length > 0
      ? Array.from(new Set(seriesOverride))
      : (await getTopSkillsDb(filters, topSkillsCount)).map((t) => t.skill)

  const seriesList = topSkills.length > 0 ? topSkills : []
  let skillsCounts: Array<{ m: string; skill: string; c: number }> = []

  if (seriesList.length > 0) {
    const jmExpr = `to_char(j."createdAt", 'YYYY-MM')`
    const baseJ = compileJobSqlWhere(nf, 'j')
    const joinQj = textSearchJoin(nf, 'j', 'q')
    const whereJ = [
      ...baseJ,
      Prisma.sql`js.kind = 'HARD'`,
      Prisma.sql`LOWER(sk.name) IN (${Prisma.join(seriesList.map((s) => s.toLowerCase()))})`,
    ]
    const whereJSql = whereJ.length
      ? Prisma.sql`WHERE ${Prisma.join(whereJ, ' AND ')}`
      : Prisma.sql``
    let skillsCountsRaw: Array<{ m: string; skill: string; c: number }>

    try {
      skillsCountsRaw = await prisma.$queryRaw<
        Array<{ m: string; skill: string; c: number }>
      >(Prisma.sql`
        ${cte}
        SELECT ${Prisma.raw(jmExpr)} AS m, sk.name AS skill, COUNT(*) AS c
        FROM "JobSkill" js
        JOIN "Job" j ON j.id = js."jobId"
        ${joinQj}
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
