import type { NextRequest } from 'next/server'

import { getJobByIdDb } from '@/server/jobs/repository.prisma'
import { getDbVersion } from '@/server/jobs/repository.prisma'
import { buildEtag } from '@/shared/react-query/keys'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await ctx.params
    const id = Number(idStr)
    if (!Number.isFinite(id)) {
      return Response.json({ error: 'Invalid id' }, { status: 400 })
    }
    // Compute ETag from db version + id; allow short-circuit 304 without hitting the item query
    const version = await getDbVersion()
    const etag = buildEtag(version, 'job', { id })
    const inm = (_req.headers && _req.headers.get('if-none-match')) || ''
    if (inm === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } })
    }

    const item = await getJobByIdDb(id)
    if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(item, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
        ETag: etag,
      },
    })
  } catch (e: unknown) {
    console.error('[api/jobs/:id] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
