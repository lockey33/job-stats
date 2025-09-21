import 'server-only'

type Bucket = { count: number; resetAt: number }

const store: Map<string, Bucket> = new Map()

export interface RateLimitOptions {
  windowMs?: number
  max?: number
}

export function rateLimit(
  key: string,
  opts: RateLimitOptions = {},
): { ok: boolean; remaining: number; resetAt: number } {
  const windowMs = opts.windowMs ?? 60_000
  const max = opts.max ?? 30
  const now = Date.now()
  const b = store.get(key)

  if (!b || b.resetAt <= now) {
    const next: Bucket = { count: 1, resetAt: now + windowMs }

    store.set(key, next)

    return { ok: true, remaining: max - 1, resetAt: next.resetAt }
  }

  if (b.count >= max) {
    return { ok: false, remaining: 0, resetAt: b.resetAt }
  }

  b.count += 1

  return { ok: true, remaining: max - b.count, resetAt: b.resetAt }
}

export function clientIpFromHeaders(h: Headers): string {
  const fwd = h.get('x-forwarded-for')

  if (fwd) return fwd.split(',')[0]!.trim()

  return h.get('x-real-ip') || h.get('cf-connecting-ip') || 'unknown'
}
