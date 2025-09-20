import 'server-only'

export function getIntParam(
  sp: URLSearchParams,
  key: string,
  opts: { min?: number; max?: number } = {},
): number | undefined {
  const raw = sp.get(key)
  if (raw == null || raw === '') return undefined
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return undefined
  if (opts.min != null && n < opts.min) return undefined
  if (opts.max != null && n > opts.max) return undefined
  return n
}

export function getBoolParam(sp: URLSearchParams, key: string): boolean | undefined {
  const raw = (sp.get(key) || '').toLowerCase()
  if (!raw) return undefined
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true
  if (['0', 'false', 'no', 'off'].includes(raw)) return false
  return undefined
}
