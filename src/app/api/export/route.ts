import type { NextRequest } from 'next/server'

import { applyFilters, dedupeById } from '@/features/jobs/utils/filtering'
import { jobItemToRow } from '@/features/jobs/utils/transformers'
import { getAllJobs, getDatasetVersion } from '@/server/jobs/repository'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// jobItemToRow centralized in shared/jobs/transformers

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = parseFiltersFromSearchParams(searchParams)
    const { page, pageSize, ...filters } = parsed // export ignores pagination
    void page
    void pageSize

    const format = (searchParams.get('format') || 'xlsx').toLowerCase()

    const [all, version] = await Promise.all([getAllJobs(), getDatasetVersion()])
    const filtered = dedupeById(applyFilters(all, filters))
    // Sort by date desc for consistency
    const sorted = filtered
      .slice()
      .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))

    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
    // Helper to stream CSV without materializing the whole string
    const streamCsv = () => {
      if (sorted.length === 0) {
        return new Response('', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="jobs_all_${ts}.csv"`,
            'X-Data-Version': version,
          },
        })
      }
      const encoder = new TextEncoder()
      const firstRow = jobItemToRow(sorted[0]!)
      const headers = Object.keys(firstRow)
      function toCSVValue(val: unknown): string {
        if (val == null) return ''
        const s = String(val)
        if (s.includes('"') || s.includes(',') || s.includes('\n'))
          return '"' + s.replace(/"/g, '""') + '"'
        return s
      }
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(headers.join(',') + '\n'))
          // stream rows in batches to avoid blocking
          const batchSize = 1000
          let index = 0
          function pushBatch() {
            const end = Math.min(sorted.length, index + batchSize)
            for (let i = index; i < end; i++) {
              const row = jobItemToRow(sorted[i]!)
              const line = headers.map((h) => toCSVValue(row[h])).join(',') + '\n'
              controller.enqueue(encoder.encode(line))
            }
            index = end
            if (index < sorted.length) {
              // Yield back to event loop
              setTimeout(pushBatch, 0)
            } else {
              controller.close()
            }
          }
          pushBatch()
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

    if (format === 'csv') {
      return streamCsv()
    }

    // XLSX generation
    // Guardrail: large XLSX exports can be memory heavy — fallback to CSV
    const envLimit = Number.parseInt(process.env.EXPORT_XLSX_LIMIT || '', 10)
    const XLSX_LIMIT =
      Number.isFinite(envLimit) && envLimit > 0 ? Math.max(1000, Math.min(envLimit, 250000)) : 50000
    if (sorted.length > XLSX_LIMIT) {
      return streamCsv()
    }
    const XLSX = await import('xlsx')
    const rows = sorted.map(jobItemToRow)
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
