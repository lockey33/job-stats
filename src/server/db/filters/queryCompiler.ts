import { Prisma, type PrismaClient } from '@prisma/client'

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
export function compileJobSqlWhere(nf: NormalizedJobFilters, alias = 'Job'): Prisma.Sql[] {
  const A = (col: string) => Prisma.raw(`"${alias}"."${col}"`)
  const clauses: Prisma.Sql[] = []
  const approx = Prisma.sql`COALESCE((${A('minTjm')} + ${A('maxTjm')})/2.0, ${A('minTjm')}, ${A('maxTjm')})`

  // Cities
  if (nf.cities.length > 0) {
    if (nf.cityMatch === 'exact') {
      const vals = nf.cities.map((c) => c.toLowerCase())
      const inner = Prisma.sql`LOWER(${A('city')}) IN (${Prisma.join(vals)})`

      clauses.push(nf.excludeCities ? Prisma.sql`NOT (${inner})` : inner)
    } else {
      const ors = nf.cities.map((c) => Prisma.sql`${A('city')} ILIKE ${`%${c}%`}`)
      const inner = Prisma.sql`(${Prisma.join(ors, ' OR ')})`

      clauses.push(nf.excludeCities ? Prisma.sql`NOT (${inner})` : inner)
    }
  }

  // Regions
  if (nf.regions.length > 0) {
    const vals = nf.regions.map((r) => r.toLowerCase())
    const inner = Prisma.sql`LOWER(${A('region')}) IN (${Prisma.join(vals)})`

    clauses.push(nf.excludeRegions ? Prisma.sql`NOT (${inner})` : inner)
  }

  // Remote
  if (nf.remote.length > 0) {
    const vals = nf.remote.map((r) => r.toLowerCase())

    clauses.push(Prisma.sql`LOWER(${A('remote')}) IN (${Prisma.join(vals)})`)
  }

  // Experience
  if (nf.experience.length > 0) {
    const vals = nf.experience.map((e) => e.toLowerCase())

    clauses.push(Prisma.sql`LOWER(${A('experience')}) IN (${Prisma.join(vals)})`)
  }

  // Job slugs
  if (nf.job_slugs.length > 0) {
    const vals = nf.job_slugs.map((s) => s.toLowerCase())

    clauses.push(Prisma.sql`LOWER(${A('jobSlug')}) IN (${Prisma.join(vals)})`)
  }

  // Title exclusions
  for (const w of nf.excludeTitle) {
    clauses.push(Prisma.sql`${A('title')} NOT ILIKE ${`%${w}%`}`)
  }

  // Dates
  if (nf.startDate) clauses.push(Prisma.sql`${A('createdAt')} >= ${new Date(nf.startDate)}`)
  if (nf.endDate) clauses.push(Prisma.sql`${A('createdAt')} <= ${new Date(nf.endDate)}`)

  // TJM approx filter
  if (typeof nf.minTjm === 'number') clauses.push(Prisma.sql`${approx} >= ${nf.minTjm}`)
  if (typeof nf.maxTjm === 'number') clauses.push(Prisma.sql`${approx} <= ${nf.maxTjm}`)

  // Skill requirements/exclusions
  for (const s of nf.skills) {
    clauses.push(
      Prisma.sql`EXISTS (SELECT 1 FROM "JobSkill" js INNER JOIN "Skill" sk ON sk.id = js."skillId" WHERE js."jobId" = ${A('id')} AND js.kind = 'HARD' AND LOWER(sk.name) = ${s.toLowerCase()})`,
    )
  }

  for (const s of nf.excludeSkills) {
    clauses.push(
      Prisma.sql`NOT EXISTS (SELECT 1 FROM "JobSkill" js INNER JOIN "Skill" sk ON sk.id = js."skillId" WHERE js."jobId" = ${A('id')} AND LOWER(sk.name) = ${s.toLowerCase()})`,
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
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM "Job"
    WHERE to_tsvector('simple',
      COALESCE("title", '') || ' ' || COALESCE("companyName", '') || ' ' || COALESCE("city", '') || ' ' ||
      COALESCE("description", '') || ' ' || COALESCE("candidateProfile", '') || ' ' || COALESCE("companyDescription", '')
    ) @@ plainto_tsquery('simple', ${q})
    ${typeof opts?.limit === 'number' ? Prisma.sql`LIMIT ${opts.limit}` : Prisma.sql``}
    ${typeof opts?.offset === 'number' ? Prisma.sql`OFFSET ${opts.offset}` : Prisma.sql``}
  `

  return rows.map((r) => Number(r.id)).filter((n) => Number.isFinite(n))
}

// CTE helper to integrate full-text search directly into analytics queries
export function buildTextSearchCTE(nf: NormalizedJobFilters, cteName = 'q'): Prisma.Sql {
  const q = (nf.q || '').trim()

  if (!q) return Prisma.sql``
  const qLower = q.toLowerCase()
  const A = (col: string) => Prisma.raw(`"j"."${col}"`)

  return Prisma.sql`WITH ${Prisma.raw(cteName)} AS (
    SELECT id FROM "Job" j
    WHERE to_tsvector('simple',
      COALESCE(${A('title')}, '') || ' ' || COALESCE(${A('companyName')}, '') || ' ' || COALESCE(${A('city')}, '') || ' ' ||
      COALESCE(${A('description')}, '') || ' ' || COALESCE(${A('candidateProfile')}, '') || ' ' || COALESCE(${A('companyDescription')}, '')
    ) @@ plainto_tsquery('simple', ${qLower})
  )`
}

export function textSearchJoin(
  nf: NormalizedJobFilters,
  targetAlias = 'Job',
  cteName = 'q',
): Prisma.Sql {
  if (!(nf.q || '').trim()) return Prisma.sql``

  // JOIN q ON <alias>.id = q.id
  return Prisma.sql`JOIN ${Prisma.raw(cteName)} ON ${Prisma.raw(`"${targetAlias}"."id"`)} = ${Prisma.raw(cteName)}.id`
}
