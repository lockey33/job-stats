import 'server-only'
import { z } from 'zod'

const csvToArray = (raw: string | null | undefined): string[] | undefined => {
  if (!raw) return undefined
  const arr = String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return arr.length > 0 ? arr : undefined
}

const intClamped = (min: number, max: number, def: number) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v == null ? undefined : Number.parseInt(String(v), 10)))
    .pipe(z.number().int().min(min).max(max))
    .catch(def)
    .default(def)

export function parseMetricsParams(searchParams: URLSearchParams) {
  const schema = z.object({
    seriesSkills: z.array(z.string()).optional(),
    topSkillsCount: intClamped(1, 200, 10),
  })
  const input = {
    seriesSkills: csvToArray(searchParams.get('seriesSkills')),
    topSkillsCount: searchParams.get('topSkillsCount') ?? undefined,
  }
  return schema.parse(input)
}

export function parseTopSkillsParams(searchParams: URLSearchParams) {
  const schema = z.object({ count: intClamped(1, 200, 50) })
  const input = { count: searchParams.get('count') ?? undefined }
  return schema.parse(input)
}

export function parseEmergingParams(searchParams: URLSearchParams) {
  const schema = z.object({
    monthsWindow: intClamped(1, 36, 12),
    topK: intClamped(1, 50, 10),
    minTotalCount: intClamped(1, 1000, 5),
  })
  const input = {
    monthsWindow: searchParams.get('monthsWindow') ?? undefined,
    topK: searchParams.get('topK') ?? undefined,
    minTotalCount: searchParams.get('minTotalCount') ?? undefined,
  }
  return schema.parse(input)
}

export function parseCitySkillParams(searchParams: URLSearchParams) {
  const schema = z.object({
    skill: z.string().min(1),
    seriesCities: z.array(z.string()).optional(),
    topCityCount: intClamped(1, 12, 5),
  })
  const input = {
    skill: searchParams.get('skill') || '',
    seriesCities: csvToArray(searchParams.get('seriesCities')),
    topCityCount: searchParams.get('topCityCount') ?? undefined,
  }
  return schema.parse(input)
}
