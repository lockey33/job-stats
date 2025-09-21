import 'server-only'

import type { PrismaClient } from '@prisma/client'

declare global {
  var __PRISMA_CLIENT__: PrismaClient | undefined
  var __PRISMA_MW_INSTALLED__: boolean | undefined
}

/**
 * Return a singleton PrismaClient configured from DATABASE_URL.
 * Caches the client on globalThis to survive Next.js HMR in dev.
 * Also installs lightweight timing middleware (once) to help spot slow queries.
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (globalThis.__PRISMA_CLIENT__) return globalThis.__PRISMA_CLIENT__

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

  const client = new PrismaClient({ datasources: { db: { url } } })

  // Install timing middleware once per process
  if (!globalThis.__PRISMA_MW_INSTALLED__) {
    const slowMs = Number(process.env.DB_SLOW_MS || '300')
    client.$use(async (params, next) => {
      const start = Date.now()
      try {
        const result = await next(params)
        const ms = Date.now() - start
        if (ms >= slowMs) {
          // Avoid logging query payloads/params to reduce noise and leakage risk
          const model = params.model || 'raw'
          const action = params.action
          // Keep concise logs; let downstream observability aggregate
          console.warn(`[prisma] slow query: ${model}.${action} took ${ms}ms`)
        }
        return result
      } catch (err) {
        const ms = Date.now() - start
        const model = params.model || 'raw'
        const action = params.action
        // Surface timing on errors too
        console.warn(`[prisma] error in ${model}.${action} after ${ms}ms: ${(err as Error)?.message}`)
        throw err
      }
    })
    globalThis.__PRISMA_MW_INSTALLED__ = true
  }

  globalThis.__PRISMA_CLIENT__ = client
  return client
}

/** Detect if the configured datasource targets Postgres */
export function isPg(): boolean {
  const url = process.env.DATABASE_URL || ''
  return url.startsWith('postgres') || url.includes('neon.tech') || url.includes('vercel-postgres')
}

/** Heuristic to detect schema-not-ready errors in dev (missing tables/columns, etc.) */
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

/**
 * Wrap a DB operation with a guard that returns a safe fallback when the schema
 * is missing in non-production environments. This centralizes the pattern used
 * across repositories today.
 */
export async function dbGuard<T>(
  op: (prisma: PrismaClient) => Promise<T>,
  fallback: T,
): Promise<T> {
  let prisma: PrismaClient
  try {
    prisma = await getPrisma()
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e)) return fallback
    throw e
  }
  try {
    return await op(prisma)
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e)) return fallback
    throw e
  }
}

