import 'server-only'

import { env } from '@/env'

export function isAuthorized(headers: Headers, url: string): boolean {
  const headerSecret = headers.get('x-admin-secret') || ''
  const key = new URL(url).searchParams.get('key') || ''
  if (!env.ADMIN_SECRET) return false
  return headerSecret === env.ADMIN_SECRET || key === env.ADMIN_SECRET
}
