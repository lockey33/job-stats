import type { NextRequest } from 'next/server'

import { jobItemToRow } from '@/features/jobs/utils/transformers'
import { fetchJobsDbBatch, getDbVersion } from '@/server/jobs/repository.prisma'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed
    void page
    void pageSize

    const format = (searchParams.get('format') || 'xlsx').toLowerCase()
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
    const version = await getDbVersion()
    const encoder = new TextEncoder()

    async function streamCsvDb() {
      const headers = Object.keys(
        jobItemToRow({
          id: 0,
          created_at: new Date().toISOString(),
          title: '',
          job_slug: '',
          slug: '',
          company_name: '',
          city: '',
          remote: '',
          experience: '',
          min_tjm: null,
          max_tjm: null,
          skills: [],
          soft_skills: [],
          description: null,
          candidate_profile: null,
          company_description: null,
        } as import('@/features/jobs/types/types').JobItem),
      )
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(encoder.encode(headers.join(',') + '\n'))
          const batchSize = 1000
          let skip = 0
          for (;;) {
            const batch = await fetchJobsDbBatch(
              filters as import('@/features/jobs/types/types').JobFilters,
              skip,
              batchSize,
            )
            if (batch.length === 0) break
            for (const it of batch) {
              const row = jobItemToRow(it)
              const line = headers
                .map((h) => {
                  const val = row[h as keyof typeof row]
                  if (val == null) return ''
                  const s = String(val)
                  return s.includes('"') || s.includes(',') || s.includes('\n')
                    ? '"' + s.replace(/"/g, '""') + '"'
                    : s
                })
                .join(',')
              controller.enqueue(encoder.encode(line + '\n'))
            }
            skip += batch.length
            if (batch.length < batchSize) break
            await new Promise((r) => setTimeout(r, 0))
          }
          controller.close()
        },
      })
      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="jobs_all_${ts}.csv"`,
          'X-Data-Version': version,
        },
      })
    }

    if (format === 'csv') return streamCsvDb()

    const envLimit = Number.parseInt(process.env.EXPORT_XLSX_LIMIT || '', 10)
    const XLSX_LIMIT =
      Number.isFinite(envLimit) && envLimit > 0 ? Math.max(1000, Math.min(envLimit, 250000)) : 50000
    const rows: import('@/shared/utils/export').Row[] = []
    const batchSize = 1000
    let skip = 0
    for (;;) {
      if (rows.length >= XLSX_LIMIT) break
      const batch = await fetchJobsDbBatch(
        filters as import('@/features/jobs/types/types').JobFilters,
        skip,
        Math.min(batchSize, XLSX_LIMIT - rows.length),
      )
      if (batch.length === 0) break
      rows.push(...batch.map((it) => jobItemToRow(it)))
      skip += batch.length
      if (batch.length < batchSize) break
    }
    if (rows.length >= XLSX_LIMIT) return streamCsvDb()
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Jobs')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="jobs_all_${ts}.xlsx"`,
        'X-Data-Version': version,
      },
    })
  } catch (e: unknown) {
    console.error('[api/export] error:', e)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
