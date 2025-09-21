import 'server-only'

import { PrismaClient } from '@prisma/client'

import { logger } from '@/server/http/logger'

/**
 * Return a singleton PrismaClient configured from DATABASE_URL.
 * Caches the client on globalThis to survive Next.js HMR in dev.
 * Also installs lightweight timing middleware (once) to help spot slow queries.
 */
export async function getPrisma(): Promise<PrismaClient> {
  const globalForPrisma = globalThis as unknown as { __prisma?: PrismaClient }

  if (globalForPrisma.__prisma) return globalForPrisma.__prisma

  const url = process.env.DATABASE_URL

  if (!url) throw new Error('DATABASE_URL is not set')

  const client = new PrismaClient({ datasources: { db: { url } } })

  // Install timing middleware once per client (guard via instance flag)
  const mwFlag = '__mwInstalled'

  if (!(client as unknown as Record<string, unknown>)[mwFlag]) {
    const slowMs = Number(process.env.DB_SLOW_MS || '300')

    client.$use(async (params, next) => {
      const start = Date.now()

      try {
        const result = await next(params)
        const ms = Date.now() - start

        if (ms >= slowMs) {
          const model = params.model || 'raw'
          const action = params.action

          logger.warn(`[prisma] slow query: ${model}.${action} took ${ms}ms`)
        }

        return result
      } catch (err) {
        const ms = Date.now() - start
        const model = params.model || 'raw'
        const action = params.action

        logger.warn(`{ msg: prisma error, model: ${model}, action: ${action}, ms: ${ms} }`)
        throw err
      }
    })
    ;(client as unknown as Record<string, unknown>)[mwFlag] = true
  }

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__prisma = client
  }

  return client
}

/** Detect if the configured datasource targets Postgres */
// PostgreSQL is the only supported DB in all environments.

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
