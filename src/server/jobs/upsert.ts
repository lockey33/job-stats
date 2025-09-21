import 'server-only'

import type { Prisma, PrismaClient } from '@prisma/client'

import { type JobItemInput,JobItemSchema } from '@/features/jobs/utils/schemas'
import { cityToRegion } from '@/shared/geo/regions'

export type IngestJob = JobItemInput

export function isEmptyStr(v?: string | null): boolean {
  return !v || v.trim() === ''
}

export function isClearlyEmpty(it: IngestJob): boolean {
  const noTitle = isEmptyStr(it.title)
  const noDesc = isEmptyStr(it.description)
  const noCompany = isEmptyStr(it.company_name)
  const noCand = isEmptyStr(it.candidate_profile)
  const noCompDesc = isEmptyStr(it.company_description)
  const noCity = isEmptyStr(it.city)
  const noSkills =
    (!Array.isArray(it.skills) || it.skills.length === 0) &&
    (!Array.isArray(it.soft_skills) || it.soft_skills.length === 0)
  return noTitle && noDesc && noCompany && noCand && noCompDesc && noCity && noSkills
}

export function validateItems(
  raw: unknown,
  { max = 20000 }: { max?: number } = {},
): IngestJob[] | null {
  try {
    const Schema = JobItemSchema.array().min(1).max(max)
    const parsed = Schema.parse(raw)
    return parsed
  } catch {
    return null
  }
}

export async function resolveTargetId(prisma: PrismaClient, it: IngestJob): Promise<number> {
  const slug = (it?.slug || it?.job_slug || '').trim()
  if (slug) {
    const found = await prisma.job.findFirst({
      where: { OR: [{ slug }, { jobSlug: slug }] },
      select: { id: true },
    })
    if (found?.id != null) return found.id
  }
  return Number(it.id)
}

function normalizeSkillName(name: unknown): string | null {
  const s = String(name ?? '').trim()
  return s ? s : null
}

type PrismaOrTx = PrismaClient | Prisma.TransactionClient

export async function ensureSkill(prisma: PrismaOrTx, cache: Map<string, number>, name: string) {
  const key = normalizeSkillName(name)
  if (!key) return null
  if (cache.has(key)) return cache.get(key)!
  const s = await prisma.skill.upsert({ where: { name: key }, update: {}, create: { name: key } })
  cache.set(key, s.id)
  return s.id
}

export async function upsertJobAndSkills(
  prisma: PrismaClient,
  it: IngestJob,
  skillCache: Map<string, number>,
) {
  const months = it?.duration?.months ?? null
  const years = it?.duration?.years ?? null
  const region = cityToRegion(it?.city ?? null)
  const targetId = await resolveTargetId(prisma, it)

  await prisma.$transaction(async (tx) => {
    await tx.job.upsert({
      where: { id: targetId },
      update: {
        createdAt: new Date(it.created_at),
        job: it?.job ?? null,
        jobSlug: it?.job_slug ?? null,
        slug: it?.slug ?? null,
        title: it?.title ?? null,
        companyName: it?.company_name ?? null,
        city: it?.city ?? null,
        region: region ?? null,
        long: it?.long ?? null,
        lat: it?.lat ?? null,
        durationMonths: months,
        durationYears: years,
        remote: it?.remote ?? null,
        maxTjm: it?.max_tjm ?? null,
        minTjm: it?.min_tjm ?? null,
        experience: it?.experience ?? null,
        description: it?.description ?? null,
        candidateProfile: it?.candidate_profile ?? null,
        companyDescription: it?.company_description ?? null,
      },
      create: {
        id: targetId,
        createdAt: new Date(it.created_at),
        job: it?.job ?? null,
        jobSlug: it?.job_slug ?? null,
        slug: it?.slug ?? null,
        title: it?.title ?? null,
        companyName: it?.company_name ?? null,
        city: it?.city ?? null,
        region: region ?? null,
        long: it?.long ?? null,
        lat: it?.lat ?? null,
        durationMonths: months,
        durationYears: years,
        remote: it?.remote ?? null,
        maxTjm: it?.max_tjm ?? null,
        minTjm: it?.min_tjm ?? null,
        experience: it?.experience ?? null,
        description: it?.description ?? null,
        candidateProfile: it?.candidate_profile ?? null,
        companyDescription: it?.company_description ?? null,
      },
    })

    await tx.jobSkill.deleteMany({ where: { jobId: targetId } })

    const hard = Array.from(
      new Set((it?.skills ?? []).map(normalizeSkillName).filter(Boolean) as string[]),
    )
    const soft = Array.from(
      new Set((it?.soft_skills ?? []).map(normalizeSkillName).filter(Boolean) as string[]),
    )

    const pairs: Array<{ skillId: number; kind: 'HARD' | 'SOFT' }> = []
    for (const name of hard) {
      const sid = await ensureSkill(tx, skillCache, name)
      if (sid) pairs.push({ skillId: sid, kind: 'HARD' })
    }
    for (const name of soft) {
      const sid = await ensureSkill(tx, skillCache, name)
      if (sid) pairs.push({ skillId: sid, kind: 'SOFT' })
    }

    if (pairs.length > 0) {
      const data = pairs.map((p) => ({ jobId: targetId, skillId: p.skillId, kind: p.kind }))
      await tx.jobSkill.createMany({ data, skipDuplicates: true })
    }
  })
}
