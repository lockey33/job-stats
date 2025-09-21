import 'server-only'

import { env } from '@/env'

export function isAuthorized(headers: Headers): boolean {
  if (!env.ADMIN_SECRET) return false
  const bearer = headers.get('authorization') || headers.get('Authorization') || ''
  const token = bearer.toLowerCase().startsWith('bearer ') ? bearer.slice(7).trim() : ''

  return token === env.ADMIN_SECRET
}
