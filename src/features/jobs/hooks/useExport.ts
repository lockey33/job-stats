'use client'

import { useCallback, useState } from 'react'

import type { JobFilters, JobsResult } from '@/features/jobs/types/types'
import { jobItemToRow } from '@/features/jobs/utils/transformers'
import { downloadBlob,downloadExcel } from '@/shared/utils/export'
import { toQueryString } from '@/shared/utils/searchParams'

export function useExport() {
  const [exporting, setExporting] = useState(false)

  const exportCurrentPage = useCallback(async (jobs: JobsResult | null | undefined) => {
    if (!jobs) return
    try {
      setExporting(true)
      const rows = jobs.items.map(jobItemToRow)
      const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)
      await downloadExcel(rows, 'Jobs', `jobs_page_${jobs.page}_${ts}.xlsx`)
    } finally {
      setExporting(false)
    }
  }, [])

  const exportAllFiltered = useCallback(async (filters: Partial<JobFilters>) => {
    try {
      setExporting(true)
      const qsCore = toQueryString(filters as Partial<JobFilters>)
      const res = await fetch(`/api/export?${qsCore}`)
      if (!res.ok) throw new Error(`Export failed: ${res.status}`)
      const blob = await res.blob()
      const cd = res.headers.get('Content-Disposition') || ''
      const match = /filename="?([^";]+)"?/i.exec(cd || '')
      const filename =
        match?.[1] || `jobs_all_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)}.xlsx`
      downloadBlob(filename, blob.type || 'application/octet-stream', blob)
    } finally {
      setExporting(false)
    }
  }, [])

  return { exporting, exportCurrentPage, exportAllFiltered } as const
}
