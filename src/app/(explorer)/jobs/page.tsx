import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

import { queryKeys } from '@/features/jobs/api/queryKeys'
import { applyFilters, dedupeById, paginate } from '@/features/jobs/utils/filtering'
import { getEmergingCached, getMetricsCached, getTopSkillsCached } from '@/server/jobs/analytics'
import { getMetaFacets } from '@/server/jobs/facets'
import { getAllJobs } from '@/server/jobs/repository'
import { parseFiltersFromSearchParams } from '@/shared/utils/searchParams'

import { JobsPageClient } from './JobsPage.client'

export const runtime = 'nodejs'

type SearchParams = Record<string, string | string[] | undefined>

export default async function JobsPage(props: { searchParams?: Promise<SearchParams> }) {
  const resolved: SearchParams | undefined = props.searchParams
    ? await props.searchParams
    : undefined

  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(resolved ?? {})) {
    if (Array.isArray(v)) v.forEach((vi) => usp.append(k, vi))
    else if (typeof v === 'string') usp.set(k, v)
  }
  const parsed = parseFiltersFromSearchParams(usp)
  const { page, pageSize, ...filters } = parsed

  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

  // Build data server-side without calling internal HTTP routes
  const [jobsAll, metaFacets, metrics, topSkills, emerging] = await Promise.all([
    getAllJobs(),
    getMetaFacets(),
    getMetricsCached(filters, 10, undefined),
    getTopSkillsCached(filters, 50),
    getEmergingCached(filters, 12, 10, 5),
  ])

  const jobsFiltered = dedupeById(applyFilters(jobsAll, filters))
  const jobsSorted = jobsFiltered
    .slice()
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
  const jobsResult = paginate(jobsSorted, { page, pageSize })

  qc.setQueryData(queryKeys.meta(), metaFacets)
  qc.setQueryData(queryKeys.jobs({ page, pageSize, ...filters }), jobsResult)
  qc.setQueryData(queryKeys.metrics({ series: 'auto', ...filters }), metrics)
  qc.setQueryData(queryKeys.topSkills({ count: 50, ...filters }), topSkills)
  qc.setQueryData(
    queryKeys.emerging({ monthsWindow: 12, topK: 10, minTotalCount: 5, ...filters }),
    emerging,
  )

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <JobsPageClient />
    </HydrationBoundary>
  )
}
