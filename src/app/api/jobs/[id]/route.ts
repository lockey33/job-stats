import type { NextRequest } from 'next/server'

import { getJobByIdDb } from '@/server/jobs/repository.prisma'
import { getDbVersion } from '@/server/jobs/repository.prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await ctx.params
    const id = Number(idStr)
    if (!Number.isFinite(id)) {
      return Response.json({ error: 'Invalid id' }, { status: 400 })
    }
    const version = await getDbVersion()
    const item = await getJobByIdDb(id)
    if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(item, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600',
        'X-Data-Version': version,
      },
    })
  } catch (e: unknown) {
    console.error('[api/jobs/:id] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
