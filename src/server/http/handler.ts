import 'server-only'

import { getDbVersion } from '@/server/db/version'
import { isAuthorized } from '@/server/http/adminAuth'
import { logger } from '@/server/http/logger'
import { clientIpFromHeaders, rateLimit as applyRateLimit } from '@/server/http/rateLimit'

export type ApiCtxUser<P = Record<string, string>> = { params?: P }
export type ApiCtxNext<P = Record<string, string>> = { params: Promise<P> }
export type ApiHandler<P = Record<string, string>> = (
  req: Request,
  ctx: ApiCtxUser<P>,
) => Promise<Response>

export type ApiOptions = {
  requireAdmin?: boolean
  rateLimit?: { windowMs?: number; max?: number; by?: 'ip' | 'ip+path' }
  cache?: { sMaxage?: number; swr?: number }
  addVersion?: boolean
  extraHeaders?: Record<string, string>
}

/**
 * Wrapper to normalize API handlers with try/catch, optional admin gate, rate limiting,
 * cache headers and data-version header injection.
 *
 * Simpler, explicit signature: withApi(opts, handler)
 */
export function withApi<P = Record<string, string>>(
  opts: ApiOptions,
  handler: ApiHandler<P>,
): (req: Request, ctx: ApiCtxNext<P>) => Promise<Response> {
  return async (req, ctxNext) => {
    try {
      const url = new URL(req.url)

      // Admin gate
      if (opts.requireAdmin && !isAuthorized(req.headers)) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Rate limit
      if (opts.rateLimit) {
        const ip = clientIpFromHeaders(req.headers)
        const base = opts.rateLimit.by === 'ip' ? ip : `${ip}|${url.pathname}`
        const res = applyRateLimit(base, opts.rateLimit)

        if (!res.ok) {
          return Response.json(
            { error: 'Too Many Requests', resetAt: res.resetAt },
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.max(0, Math.ceil((res.resetAt - Date.now()) / 1000))),
              },
            },
          )
        }
      }

      let paramsResolved: P | undefined

      try {
        // Next 15 typegen provides params as a Promise
        paramsResolved = (await (ctxNext as ApiCtxNext<P>).params) as unknown as P
      } catch {
        paramsResolved = undefined
      }

      const userCtx =
        paramsResolved === undefined
          ? ({} as ApiCtxUser<P>)
          : ({ params: paramsResolved } as ApiCtxUser<P>)
      const resp = await handler(req, userCtx)
      const headers = new Headers(resp.headers)

      // Cache-Control if requested and not already set by handler
      if (opts.cache && !headers.has('Cache-Control')) {
        const sMaxage = Math.max(0, Number(opts.cache.sMaxage ?? 0))
        const swr = Math.max(0, Number(opts.cache.swr ?? 0))

        headers.set('Cache-Control', `s-maxage=${sMaxage}, stale-while-revalidate=${swr}`)
      }

      // X-Data-Version if requested and not already set by handler
      if (opts.addVersion && !headers.has('X-Data-Version')) {
        try {
          const v = await getDbVersion()

          headers.set('X-Data-Version', v)
        } catch {
          // ignore version errors to not fail the request
        }
      }

      // Extra headers
      if (opts.extraHeaders) {
        for (const [k, v] of Object.entries(opts.extraHeaders)) headers.set(k, v)
      }

      return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers })
    } catch (e) {
      logger.error('[api] unhandled error:')
      logger.error(e)

      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// Helpers with sensible defaults to reduce repetition in routes

const DEFAULT_CACHE: NonNullable<ApiOptions['cache']> = { sMaxage: 300, swr: 600 }

export function withCachedApi<P = Record<string, string>>(
  handler: ApiHandler<P>,
  opts?: Partial<ApiOptions>,
): (req: Request, ctx: ApiCtxNext<P>) => Promise<Response> {
  const merged: ApiOptions = { cache: DEFAULT_CACHE, addVersion: true, ...(opts || {}) }

  return withApi(merged, handler)
}

export function withCachedRateLimitedApi<P = Record<string, string>>(
  rate: NonNullable<ApiOptions['rateLimit']>,
  handler: ApiHandler<P>,
  opts?: Partial<ApiOptions>,
): (req: Request, ctx: ApiCtxNext<P>) => Promise<Response> {
  const merged: ApiOptions = {
    cache: DEFAULT_CACHE,
    addVersion: true,
    rateLimit: rate,
    ...(opts || {}),
  }

  return withApi(merged, handler)
}

export function withAdminApi<P = Record<string, string>>(
  handler: ApiHandler<P>,
  opts?: Partial<ApiOptions>,
): (req: Request, ctx: ApiCtxNext<P>) => Promise<Response> {
  const merged: ApiOptions = {
    cache: DEFAULT_CACHE,
    addVersion: true,
    requireAdmin: true,
    ...(opts || {}),
  }

  return withApi(merged, handler)
}
