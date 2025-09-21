import 'server-only'

import { Prisma } from '@prisma/client'

import type { JobFilters, TopSkill } from '@/features/jobs/types/types'
import { getPrisma, isSchemaMissingError } from '@/server/db/client'
import { normalizeJobFilters } from '@/server/db/filters/jobFilters'
import {
  buildTextSearchCTE,
  compileJobSqlWhere,
  textSearchJoin,
} from '@/server/db/filters/queryCompiler'

export async function getTopSkillsDb(
  filters: JobFilters,
  topSkillsCount = 50,
): Promise<TopSkill[]> {
  const nf = normalizeJobFilters(filters)
  let prisma: Awaited<ReturnType<typeof getPrisma>>

  try {
    prisma = await getPrisma()
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e)) return []
    throw e
  }

  const base = compileJobSqlWhere(nf, 'j')
  const cte = buildTextSearchCTE(nf, 'q')
  const joinQ = textSearchJoin(nf, 'j', 'q')
  const where = [...base, Prisma.sql`js.kind = 'HARD'`]
  const whereSql = where.length ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.sql``
  let rows: Array<{ skill: string; cnt: number }> = []

  try {
    rows = await prisma.$queryRaw<Array<{ skill: string; cnt: number }>>(Prisma.sql`
      ${cte}
      SELECT sk.name AS skill, COUNT(*) AS cnt
      FROM "JobSkill" js
      JOIN "Job" j ON j.id = js."jobId"
      ${joinQ}
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
