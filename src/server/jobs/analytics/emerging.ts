import 'server-only'

import { Prisma } from '@prisma/client'

import type {
  EmergingSkillTrend,
  EmergingSkillTrendPayload,
  JobFilters,
} from '@/features/jobs/types/types'
import { getPrisma, isSchemaMissingError } from '@/server/db/client'
import { normalizeJobFilters } from '@/server/db/filters/jobFilters'
import {
  buildTextSearchCTE,
  compileJobSqlWhere,
  textSearchJoin,
} from '@/server/db/filters/queryCompiler'
import { linearSlope } from '@/server/jobs/utils/stats'

export async function getEmergingDb(
  filters: JobFilters,
  monthsWindow = 12,
  topK = 10,
  minTotalCount = 5,
): Promise<EmergingSkillTrendPayload> {
  const nf = normalizeJobFilters(filters)
  let prisma: Awaited<ReturnType<typeof getPrisma>>

  try {
    prisma = await getPrisma()
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e))
      return { months: [], trends: [] }
    throw e
  }

  const jmExpr = `to_char(j."createdAt", 'YYYY-MM')`
  const baseJ = compileJobSqlWhere(nf, 'j')
  const cte = buildTextSearchCTE(nf, 'q')
  const joinQ = textSearchJoin(nf, 'j', 'q')
  const whereJ = [...baseJ, Prisma.sql`js.kind = 'HARD'`]
  const whereJSql = whereJ.length ? Prisma.sql`WHERE ${Prisma.join(whereJ, ' AND ')}` : Prisma.sql``
  let rows: Array<{ m: string; skill: string; c: number }>

  try {
    rows = await prisma.$queryRaw<Array<{ m: string; skill: string; c: number }>>(Prisma.sql`
      ${cte}
      SELECT ${Prisma.raw(jmExpr)} AS m, sk.name AS skill, COUNT(*) AS c
      FROM "JobSkill" js
      JOIN "Job" j ON j.id = js."jobId"
      ${joinQ}
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

  const rowsNorm = rows.map((r) => ({ m: String(r.m).slice(0, 7), skill: r.skill, c: Number(r.c) }))

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

  const rankByMonth: Record<string, Record<string, number>> = {}

  for (const m of months) {
    const entries = Object.entries(countsByMonth[m] || {}).sort((a, b) => b[1] - a[1])
    const ranks: Record<string, number> = {}

    for (let i = 0; i < entries.length; i++) ranks[entries[i]![0]] = i + 1
    rankByMonth[m] = ranks
  }

  const defaultRankPerMonth: Record<string, number> = {}

  for (const m of months) defaultRankPerMonth[m] = Object.keys(rankByMonth[m] ?? {}).length + 1

  const skills = Object.keys(totalInWindow).filter((s) => totalInWindow[s]! >= minTotalCount)
  const trends: EmergingSkillTrend[] = []

  for (const s of skills) {
    const y = months.map((m) => rankByMonth[m]?.[s] ?? defaultRankPerMonth[m])
    const monthly = months.map((m, idx) => ({ month: m, rank: y[idx] as number }))

    trends.push({ skill: s, monthly, slope: linearSlope(y as number[]) })
  }

  trends.sort((a, b) => {
    if (a.slope !== b.slope) return a.slope - b.slope
    const ar = a.monthly.at(-1)?.rank ?? Number.MAX_SAFE_INTEGER
    const br = b.monthly.at(-1)?.rank ?? Number.MAX_SAFE_INTEGER

    return ar - br
  })

  return { months, trends: trends.slice(0, topK) }
}
