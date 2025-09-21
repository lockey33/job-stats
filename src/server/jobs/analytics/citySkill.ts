import 'server-only'

import { Prisma } from '@prisma/client'

import type { JobFilters, MonthlyPoint } from '@/features/jobs/types/types'
import { getPrisma, isSchemaMissingError } from '@/server/db/client'
import { normalizeJobFilters } from '@/server/db/filters/jobFilters'
import {
  buildTextSearchCTE,
  compileJobSqlWhere,
  textSearchJoin,
} from '@/server/db/filters/queryCompiler'

export async function getCitySkillTrendDb(
  filters: JobFilters,
  skill: string,
  seriesCities?: string[],
  topCityCount = 5,
) {
  const nf = normalizeJobFilters(filters)
  let prisma: Awaited<ReturnType<typeof getPrisma>>

  try {
    prisma = await getPrisma()
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e))
      return { months: [], citySeries: {}, topCities: [] }
    throw e
  }

  const baseJ = compileJobSqlWhere(nf, 'j')
  const cte = buildTextSearchCTE(nf, 'q')
  const joinQ = textSearchJoin(nf, 'j', 'q')
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
      ${cte}
      SELECT ${Prisma.raw(jcExpr)} AS m, COALESCE(j.city, '—') AS city, COUNT(*) AS c
      FROM "JobSkill" js
      JOIN "Job" j ON j.id = js."jobId"
      ${joinQ}
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
