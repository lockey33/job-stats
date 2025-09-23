import 'server-only'

import { PrismaClient } from '@prisma/client'

import { logger } from '@/server/http/logger'

// Config
const SLOW_MS = Number(process.env.DB_SLOW_MS || '300')
const LOG_OPTS =
  process.env.NODE_ENV !== 'production'
    ? [
        { emit: 'event', level: 'query' } as const,
        { emit: 'event', level: 'warn' } as const,
        { emit: 'event', level: 'error' } as const,
      ]
    : [{ emit: 'event', level: 'error' } as const]

// Cache de Promise pour éviter les races + HMR Next
let prismaPromise: Promise<PrismaClient> | undefined

export function getPrisma(): Promise<PrismaClient> {
  if (prismaPromise) return prismaPromise

  const g = globalThis as unknown as { __prismaPromise?: Promise<PrismaClient> }

  if (process.env.NODE_ENV !== 'production' && g.__prismaPromise) return g.__prismaPromise

  prismaPromise = (async () => {
    const url = process.env.DATABASE_URL

    if (!url) throw new Error('DATABASE_URL is not set')

    const client = new PrismaClient({ datasources: { db: { url } }, log: LOG_OPTS })

    // Slow-query + erreurs via events (pas de middleware déprécié)
    client.$on('query', (e) => {
      if (typeof e.duration === 'number' && e.duration >= SLOW_MS) {
        const model = e.target ?? 'raw'

        // e.query contient la requête, garder court pour éviter le bruit
        logger.warn(`[prisma] slow query ${model} ${e.duration}ms`)
      }
    })
    client.$on('warn', (e) => {
      logger.warn(`[prisma] warn ${e.message}`)
    })
    client.$on('error', (e) => {
      logger.warn(`[prisma] error ${e.message}`)
    })

    await client.$connect()

    return client
  })()

  if (process.env.NODE_ENV !== 'production') g.__prismaPromise = prismaPromise

  return prismaPromise
}

// Erreurs de schéma manquant
export function isSchemaMissingError(e: unknown): boolean {
  const any = e as { code?: string; message?: string }
  const code = any?.code ?? ''
  const msg = any?.message ?? ''

  if (code === 'P2021' || code === 'P2022' || code === 'P2010') return true
  if (/no such table/i.test(msg)) return true
  if (/relation .* does not exist/i.test(msg)) return true
  if (/column .* does not exist/i.test(msg)) return true
  if (/DATABASE_URL is not set/i.test(msg)) return true

  return false
}

// Erreurs de connectivité
export function isConnectivityError(e: unknown): boolean {
  const code = (e as { code?: string })?.code ?? ''

  return code === 'P1001' || code === 'P1002' || code === 'P1008'
}

// Garde DB avec fallback en non-prod si schéma manquant
export async function dbGuard<T>(
  op: (prisma: PrismaClient) => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const prisma = await getPrisma()

    return await op(prisma)
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && isSchemaMissingError(e)) return fallback
    throw e
  }
}

/*
Notes:
- Runtime Node.js uniquement (Pas Edge).
- En serverless, utiliser Prisma Accelerate ou PgBouncer pour limiter les connexions.
*/
