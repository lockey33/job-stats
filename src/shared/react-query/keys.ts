import { stableStringify } from '@/shared/utils/stableStringify'

// Normalize query params for keys/ETags: remove undefineds, sort arrays of primitives
export function normalizeKeyParams(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined) continue
    if (Array.isArray(v)) {
      const arr = v
        .filter((x) => x !== undefined && x !== null && x !== '')
        .map((x) => (typeof x === 'number' || typeof x === 'boolean' ? x : String(x)))
      try {
        arr.sort((a, b) => String(a).localeCompare(String(b)))
      } catch {}
      out[k] = arr
    } else if (v && typeof v === 'object') {
      // shallow normalize for nested objects
      out[k] = normalizeKeyParams(v as Record<string, unknown>)
    } else {
      out[k] = v
    }
  }
  return out
}

// Build a stable string key for React Query based on params
export function paramsKey(params: Record<string, unknown>): string {
  return stableStringify(normalizeKeyParams(params))
}

// Build a normalized ETag based on dataset version + scope + params
export function buildEtag(version: string, scope: string, params: Record<string, unknown> = {}): string {
  const key = stableStringify({ scope, ...normalizeKeyParams(params) })
  return `W/"${version}|${key}"`
}
