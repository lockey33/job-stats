import { withCachedApi } from '@/server/http/handler'
import { getJobByIdDb } from '@/server/jobs/repository'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = withCachedApi(async (_req, { params }) => {
  const id = Number(params?.id)

  if (!Number.isFinite(id)) {
    return Response.json({ error: 'Invalid id' }, { status: 400 })
  }

  const item = await getJobByIdDb(id)

  if (!item) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json(item)
})
