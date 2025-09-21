import type { Prisma } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import { Prisma as PrismaNS } from '@prisma/client'

import { isPg } from '../client'
import type { NormalizedJobFilters } from './jobFilters'

// Prisma compiler: NormalizedJobFilters -> Prisma.JobWhereInput
export function compileJobWhere(nf: NormalizedJobFilters): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = { AND: [] }
  const AND = where.AND as Prisma.JobWhereInput[]

  // Required hard skills
  for (const s of nf.skills) {
    AND.push({
      skills: {
        some: { kind: 'HARD', skill: { name: { equals: s, mode: 'insensitive' } } },
      },
    })
  }

  // Exclude any of these skills
  for (const s of nf.excludeSkills) {
    AND.push({ NOT: { skills: { some: { skill: { name: { equals: s, mode: 'insensitive' } } } } } })
  }

  // Title exclusions
  for (const w of nf.excludeTitle) {
    AND.push({ NOT: { title: { contains: w, mode: 'insensitive' } } })
  }

  // Cities
  if (nf.cities.length > 0) {
    const match: Prisma.JobWhereInput =
      nf.cityMatch === 'exact'
        ? { OR: nf.cities.map((c) => ({ city: { equals: c, mode: 'insensitive' } })) }
        : { OR: nf.cities.map((c) => ({ city: { contains: c, mode: 'insensitive' } })) }
    if (nf.excludeCities) AND.push({ NOT: match })
    else AND.push(match)
  }

  // Regions
  if (nf.regions.length > 0) {
    const match: Prisma.JobWhereInput = {
      OR: nf.regions.map((r) => ({ region: { equals: r, mode: 'insensitive' } })),
    }
    if (nf.excludeRegions) AND.push({ NOT: match })
    else AND.push(match)
  }

  // Remote
  if (nf.remote.length > 0) {
    AND.push({ OR: nf.remote.map((r) => ({ remote: { equals: r, mode: 'insensitive' } })) })
  }

  // Experience
  if (nf.experience.length > 0) {
    AND.push({ OR: nf.experience.map((e) => ({ experience: { equals: e, mode: 'insensitive' } })) })
  }

  // Job slugs
  if (nf.job_slugs.length > 0) {
    AND.push({ OR: nf.job_slugs.map((s) => ({ jobSlug: { equals: s, mode: 'insensitive' } })) })
  }

  // Price range (approx via min/max)
  if (typeof nf.minTjm === 'number') {
    AND.push({ OR: [{ minTjm: { gte: nf.minTjm } }, { maxTjm: { gte: nf.minTjm } }] })
  }
  if (typeof nf.maxTjm === 'number') {
    AND.push({ OR: [{ minTjm: { lte: nf.maxTjm } }, { maxTjm: { lte: nf.maxTjm } }] })
  }

  // Dates
  if (nf.startDate) AND.push({ createdAt: { gte: new Date(nf.startDate) } })
  if (nf.endDate) AND.push({ createdAt: { lte: new Date(nf.endDate) } })

  return where
}

// SQL compiler: NormalizedJobFilters -> list of Prisma.Sql clauses (Postgres only)
export function compileJobSqlWhere(nf: NormalizedJobFilters, alias = 'Job'): PrismaNS.Sql[] {
  const A = (col: string) => PrismaNS.raw(`"${alias}"."${col}"`)
  const clauses: PrismaNS.Sql[] = []
  const approx = PrismaNS.sql`COALESCE((${A('minTjm')} + ${A('maxTjm')})/2.0, ${A('minTjm')}, ${A('maxTjm')})`

  // Cities
  if (nf.cities.length > 0) {
    if (nf.cityMatch === 'exact') {
      const vals = nf.cities.map((c) => c.toLowerCase())
      const inner = PrismaNS.sql`LOWER(${A('city')}) IN (${PrismaNS.join(vals)})`
      clauses.push(nf.excludeCities ? PrismaNS.sql`NOT (${inner})` : inner)
    } else {
      const ors = nf.cities.map((c) => {
        const like = `%${c.toLowerCase()}%`
        return PrismaNS.sql`LOWER(${A('city')}) LIKE ${like}`
      })
      const inner = PrismaNS.sql`(${PrismaNS.join(ors, ' OR ')})`
      clauses.push(nf.excludeCities ? PrismaNS.sql`NOT ${inner}` : inner)
    }
  }

  // Regions
  if (nf.regions.length > 0) {
    const vals = nf.regions.map((r) => r.toLowerCase())
    const inner = PrismaNS.sql`LOWER(${A('region')}) IN (${PrismaNS.join(vals)})`
    clauses.push(nf.excludeRegions ? PrismaNS.sql`NOT (${inner})` : inner)
  }

  // Remote
  if (nf.remote.length > 0) {
    const vals = nf.remote.map((r) => r.toLowerCase())
    clauses.push(PrismaNS.sql`LOWER(${A('remote')}) IN (${PrismaNS.join(vals)})`)
  }

  // Experience
  if (nf.experience.length > 0) {
    const vals = nf.experience.map((e) => e.toLowerCase())
    clauses.push(PrismaNS.sql`LOWER(${A('experience')}) IN (${PrismaNS.join(vals)})`)
  }

  // Job slugs
  if (nf.job_slugs.length > 0) {
    const vals = nf.job_slugs.map((s) => s.toLowerCase())
    clauses.push(PrismaNS.sql`LOWER(${A('jobSlug')}) IN (${PrismaNS.join(vals)})`)
  }

  // Title exclusions
  for (const w of nf.excludeTitle) {
    const like = `%${w.toLowerCase()}%`
    clauses.push(PrismaNS.sql`LOWER(${A('title')}) NOT LIKE ${like}`)
  }

  // Dates
  if (nf.startDate) clauses.push(PrismaNS.sql`${A('createdAt')} >= ${new Date(nf.startDate)}`)
  if (nf.endDate) clauses.push(PrismaNS.sql`${A('createdAt')} <= ${new Date(nf.endDate)}`)

  // TJM approx filter
  if (typeof nf.minTjm === 'number') clauses.push(PrismaNS.sql`${approx} >= ${nf.minTjm}`)
  if (typeof nf.maxTjm === 'number') clauses.push(PrismaNS.sql`${approx} <= ${nf.maxTjm}`)

  // Skill requirements/exclusions
  for (const s of nf.skills) {
    clauses.push(
      PrismaNS.sql`EXISTS (SELECT 1 FROM "JobSkill" js INNER JOIN "Skill" sk ON sk.id = js."skillId" WHERE js."jobId" = ${A('id')} AND js.kind = 'HARD' AND LOWER(sk.name) = ${s.toLowerCase()})`,
    )
  }
  for (const s of nf.excludeSkills) {
    clauses.push(
      PrismaNS.sql`NOT EXISTS (SELECT 1 FROM "JobSkill" js INNER JOIN "Skill" sk ON sk.id = js."skillId" WHERE js."jobId" = ${A('id')} AND LOWER(sk.name) = ${s.toLowerCase()})`,
    )
  }

  return clauses
}

export async function resolveTextSearchIds(
  prisma: PrismaClient,
  nf: NormalizedJobFilters,
  opts?: { limit?: number; offset?: number },
): Promise<number[]> {
  const q = (nf.q || '').trim()
  if (!q) return []

  if (isPg()) {
    const rows = await prisma.$queryRaw<Array<{ id: number }>>`
      SELECT id FROM "Job"
      WHERE to_tsvector('simple',
        COALESCE("title", '') || ' ' || COALESCE("companyName", '') || ' ' || COALESCE("city", '') || ' ' ||
        COALESCE("description", '') || ' ' || COALESCE("candidateProfile", '') || ' ' || COALESCE("companyDescription", '')
      ) @@ plainto_tsquery('simple', ${q})
      ${typeof opts?.limit === 'number' ? PrismaNS.sql`LIMIT ${opts.limit}` : PrismaNS.sql``}
      ${typeof opts?.offset === 'number' ? PrismaNS.sql`OFFSET ${opts.offset}` : PrismaNS.sql``}
    `
    return rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n))
  }

  const like = `%${q.toLowerCase()}%`
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM Job WHERE
      LOWER(COALESCE(title, '')) LIKE ${like} OR
      LOWER(COALESCE(companyName, '')) LIKE ${like} OR
      LOWER(COALESCE(city, '')) LIKE ${like} OR
      LOWER(COALESCE(description, '')) LIKE ${like} OR
      LOWER(COALESCE(candidateProfile, '')) LIKE ${like} OR
      LOWER(COALESCE(companyDescription, '')) LIKE ${like}
    ${typeof opts?.limit === 'number' ? PrismaNS.sql`LIMIT ${opts.limit}` : PrismaNS.sql``}
    ${typeof opts?.offset === 'number' ? PrismaNS.sql`OFFSET ${opts.offset}` : PrismaNS.sql``}
  `
  return rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n))
}

// CTE helper to integrate full-text search directly into analytics queries
export function buildTextSearchCTE(
  nf: NormalizedJobFilters,
  cteName = 'q',
): PrismaNS.Sql {
  const q = (nf.q || '').trim()
  if (!q) return PrismaNS.sql``
  const qLower = q.toLowerCase()
  const A = (col: string) => PrismaNS.raw(`"j"."${col}"`)
  if (isPg()) {
    return PrismaNS.sql`WITH ${PrismaNS.raw(cteName)} AS (
      SELECT id FROM "Job" j
      WHERE to_tsvector('simple',
        COALESCE(${A('title')}, '') || ' ' || COALESCE(${A('companyName')}, '') || ' ' || COALESCE(${A('city')}, '') || ' ' ||
        COALESCE(${A('description')}, '') || ' ' || COALESCE(${A('candidateProfile')}, '') || ' ' || COALESCE(${A('companyDescription')}, '')
      ) @@ plainto_tsquery('simple', ${qLower})
    )`
  }
  const like = `%${qLower}%`
  return PrismaNS.sql`WITH ${PrismaNS.raw(cteName)} AS (
    SELECT id FROM "Job" j WHERE
      LOWER(COALESCE(${A('title')}, '')) LIKE ${like} OR
      LOWER(COALESCE(${A('companyName')}, '')) LIKE ${like} OR
      LOWER(COALESCE(${A('city')}, '')) LIKE ${like} OR
      LOWER(COALESCE(${A('description')}, '')) LIKE ${like} OR
      LOWER(COALESCE(${A('candidateProfile')}, '')) LIKE ${like} OR
      LOWER(COALESCE(${A('companyDescription')}, '')) LIKE ${like}
  )`
}

export function textSearchJoin(
  nf: NormalizedJobFilters,
  targetAlias = 'Job',
  cteName = 'q',
): PrismaNS.Sql {
  if (!(nf.q || '').trim()) return PrismaNS.sql``
  // JOIN q ON <alias>.id = q.id
  return PrismaNS.sql`JOIN ${PrismaNS.raw(cteName)} ON ${PrismaNS.raw(`"${targetAlias}"."id"`)} = ${PrismaNS.raw(cteName)}.id`
}
