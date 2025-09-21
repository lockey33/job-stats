import 'server-only'

import { dbGuard } from '@/server/db/client'

/**
 * Lightweight data version based on jobs count and max(createdAt).
 * Falls back to 'db-0-0' when schema is missing in non-production.
 */
export async function getDbVersion(): Promise<string> {
  return dbGuard(async (prisma) => {
    const [count, maxCreated] = await Promise.all([
      prisma.job.count(),
      prisma.job.aggregate({ _max: { createdAt: true } }),
    ])
    const ts = maxCreated._max.createdAt
      ? Math.floor(maxCreated._max.createdAt.getTime() / 1000)
      : 0

    return `db-${count}-${ts}`
  }, 'db-0-0')
}
