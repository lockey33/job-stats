import 'server-only'

import type { Prisma } from '@prisma/client'
import type { Job } from '@prisma/client'

import type {
  JobFilters,
  JobItem,
  JobsResult,
  MetaFacets,
  Pagination,
} from '@/features/jobs/types/types'
import { dbGuard } from '@/server/db/client'
import { normalizeJobFilters } from '@/server/db/filters/jobFilters'
import { compileJobWhere, resolveTextSearchIds } from '@/server/db/filters/queryCompiler'


function mapJobRecord(
  j: Job & { skills: Array<{ kind: string; skill: { name: string } }> },
): JobItem {
  return {
    id: j.id,
    created_at: j.createdAt.toISOString(),
    job: j.job ?? null,
    job_slug: j.jobSlug ?? null,
    slug: j.slug ?? null,
    title: j.title ?? null,
    skills: j.skills.filter((x) => x.kind === 'HARD').map((x) => x.skill.name),
    soft_skills: j.skills.filter((x) => x.kind === 'SOFT').map((x) => x.skill.name),
    company_name: j.companyName ?? null,
    city: j.city ?? null,
    long: j.long ?? null,
    lat: j.lat ?? null,
    duration:
      j.durationMonths != null || j.durationYears != null
        ? {
            ...(j.durationMonths != null ? { months: j.durationMonths } : {}),
            ...(j.durationYears != null ? { years: j.durationYears } : {}),
          }
        : null,
    remote: j.remote ?? null,
    max_tjm: j.maxTjm ?? null,
    min_tjm: j.minTjm ?? null,
    experience: j.experience ?? null,
    description: j.description ?? null,
    candidate_profile: j.candidateProfile ?? null,
    company_description: j.companyDescription ?? null,
  }
}

export async function queryJobsDb(
  filters: JobFilters,
  { page, pageSize }: Pagination,
): Promise<JobsResult> {
  const nf = normalizeJobFilters(filters)
  const where = compileJobWhere(nf)
  const fallback: JobsResult = { items: [], total: 0, page, pageSize, pageCount: 1 }

  return dbGuard(async (prisma) => {
    if (nf.q) {
      const ids = await resolveTextSearchIds(prisma, nf)

      if (ids.length === 0) return fallback
      ;(where as Prisma.JobWhereInput).id = { in: ids }
    }

    const [total, items] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { skills: { include: { skill: true } } },
      }),
    ])
    const out: JobItem[] = items.map((j) => mapJobRecord(j))
    const pageCount = Math.max(1, Math.ceil(total / pageSize))

    return { items: out, total, page, pageSize, pageCount }
  }, fallback)
}


export async function getMetaFacetsDb(): Promise<MetaFacets> {
  const fallback: MetaFacets = {
    skills: [],
    cities: [],
    regions: [],
    job_slugs: [],
    experience: [],
    remote: [],
    tjm: { min: null, max: null },
    created_at: { min: null, max: null },
  }

  return dbGuard(async (prisma) => {
    const [skills, cities, regions, jobSlugs, experiences, remotes, tjm, dates] = await Promise.all([
      prisma.skill.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
      prisma.job.findMany({ select: { city: true }, where: { city: { not: null } }, distinct: ['city'] }),
      prisma.job.findMany({ select: { region: true }, where: { region: { not: null } }, distinct: ['region'] }),
      prisma.job.findMany({ select: { jobSlug: true }, where: { jobSlug: { not: null } }, distinct: ['jobSlug'] }),
      prisma.job.findMany({ select: { experience: true }, where: { experience: { not: null } }, distinct: ['experience'] }),
      prisma.job.findMany({ select: { remote: true }, where: { remote: { not: null } }, distinct: ['remote'] }),
      prisma.job.aggregate({ _min: { minTjm: true }, _max: { maxTjm: true } }),
      prisma.job.aggregate({ _min: { createdAt: true }, _max: { createdAt: true } }),
    ])

    return {
      skills: skills.map((s) => s.name),
      cities: cities.map((c) => c.city!).sort((a, b) => a.localeCompare(b)),
      regions: regions.map((r) => r.region!).sort((a, b) => a.localeCompare(b)),
      job_slugs: jobSlugs.map((s) => s.jobSlug!).sort((a, b) => a.localeCompare(b)),
      experience: experiences.map((e) => e.experience!).sort((a, b) => a.localeCompare(b)),
      remote: remotes.map((r) => r.remote!).sort((a, b) => a.localeCompare(b)),
      tjm: { min: tjm._min.minTjm ?? null, max: tjm._max.maxTjm ?? null },
      created_at: {
        min: dates._min.createdAt ? dates._min.createdAt.toISOString().slice(0, 10) : null,
        max: dates._max.createdAt ? dates._max.createdAt.toISOString().slice(0, 10) : null,
      },
    }
  }, fallback)
}

export async function fetchJobsDbBatch(
  filters: JobFilters,
  skip: number,
  take: number,
): Promise<JobItem[]> {
  const nf = normalizeJobFilters(filters)
  const where = compileJobWhere(nf)

  return dbGuard(async (prisma) => {
    if (nf.q) {
      const ids = await resolveTextSearchIds(prisma, nf, { limit: take, offset: skip })

      if (ids.length === 0) return []
      ;(where as Prisma.JobWhereInput).id = { in: ids }
    }

    const items = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { skills: { include: { skill: true } } },
    })

    return items.map((j) => mapJobRecord(j))
  }, [])
}

export async function getJobByIdDb(id: number): Promise<JobItem | null> {
  return dbGuard(async (prisma) => {
    const j = await prisma.job.findUnique({
      where: { id },
      include: { skills: { include: { skill: true } } },
    })

    if (!j) return null
    const it: JobItem = mapJobRecord(j)

    return it
  }, null)
}
