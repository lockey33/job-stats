import 'server-only'

// no-op imports removed; no filesystem operations needed

import type { PrismaClient } from '@prisma/client'
let _client: PrismaClient | null = null

export async function getPrisma(): Promise<PrismaClient> {
  if (_client) return _client
  // Lazily import to avoid bundling when DB not used
  const mod = await import('@prisma/client').catch((e) => {
    throw new Error(
      'Prisma client not available. Install @prisma/client and prisma, and run prisma generate. ' +
        String((e as Error)?.message || e),
    )
  })
  type PrismaModule = typeof import('@prisma/client')
  const { PrismaClient } = mod as unknown as PrismaModule
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  _client = new PrismaClient({ datasources: { db: { url } } })
  return _client
}

export function isSchemaMissingError(e: unknown): boolean {
  const any = e as { code?: string; message?: string }
  const code = any?.code || ''
  const msg = any?.message || ''
  // Prisma codes: P2021 (table not found), P2022 (column), P2010 (raw query failed)
  if (code === 'P2021' || code === 'P2022' || code === 'P2010') return true
  if (/no such table/i.test(msg)) return true
  if (/relation .* does not exist/i.test(msg)) return true
  if (/DATABASE_URL is not set/i.test(msg)) return true
  return false
}
