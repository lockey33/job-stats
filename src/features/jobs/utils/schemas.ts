import { z } from 'zod'

export const JobItemSchema = z.object({
  id: z.coerce.number(),
  created_at: z.string(),
  job: z.string().nullable().optional(),
  job_slug: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  skills: z.array(z.string()).optional(),
  soft_skills: z.array(z.string()).optional(),
  company_name: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  long: z.number().nullable().optional(),
  lat: z.number().nullable().optional(),
  duration: z
    .object({ months: z.number().optional(), years: z.number().optional() })
    .nullable()
    .optional(),
  remote: z
    .union([z.literal('full'), z.literal('partial'), z.literal('none'), z.string()])
    .nullable()
    .optional(),
  max_tjm: z.number().nullable().optional(),
  min_tjm: z.number().nullable().optional(),
  experience: z
    .union([z.literal('junior'), z.literal('intermediate'), z.literal('senior'), z.string()])
    .nullable()
    .optional(),
  description: z.string().nullable().optional(),
  candidate_profile: z.string().nullable().optional(),
  company_description: z.string().nullable().optional(),
})

export type JobItemInput = z.infer<typeof JobItemSchema>
