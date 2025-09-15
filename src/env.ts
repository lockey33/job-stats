import 'server-only'

import { z } from 'zod'

const EnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  ADMIN_SECRET: z.string().optional(),
  DATA_MERGED_PATH: z.string().optional(),
})

export const env = EnvSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  ADMIN_SECRET: process.env.ADMIN_SECRET,
  DATA_MERGED_PATH: process.env.DATA_MERGED_PATH,
})
