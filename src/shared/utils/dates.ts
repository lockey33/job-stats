import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export type DateLike = string | number | Date

export function parseToDate(input: DateLike): Date | null {
  if (input == null) return null
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input

  // number or numeric string handling (epoch seconds or milliseconds)
  const asNumber =
    typeof input === 'number' ? input : /^\d+$/u.test(String(input)) ? Number(input) : null
  if (typeof asNumber === 'number' && !Number.isNaN(asNumber)) {
    const ms = asNumber > 1e12 ? asNumber : asNumber * 1000
    const d = new Date(ms)
    return isNaN(d.getTime()) ? null : d
  }

  const s = String(input).trim()
  // yyyy-mm
  if (/^\d{4}-\d{2}$/.test(s)) {
    const d = new Date(`${s}-01`)
    return isNaN(d.getTime()) ? null : d
  }
  // Try native parse (handles ISO like 2024-09-10T12:34:56Z)
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export function formatMonthFR(input: DateLike): string {
  const d = parseToDate(input)
  if (!d) return String(input)
  return format(d, 'MMM yyyy', { locale: fr })
}
