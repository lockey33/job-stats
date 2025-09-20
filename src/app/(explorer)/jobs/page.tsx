import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

import {
  emergingQuery,
  jobsQuery,
  metaQuery,
  metricsQuery,
  topSkillsQuery,
} from '@/server/jobs/queries'
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

  await Promise.all([
    qc.prefetchQuery(metaQuery()),
    qc.prefetchQuery(jobsQuery({ page, pageSize, filters })),
    // charts data
    qc.prefetchQuery(metricsQuery(filters)),
    qc.prefetchQuery(topSkillsQuery(filters, 50)),
    qc.prefetchQuery(emergingQuery(filters, 12, 10, 5)),
  ])

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <JobsPageClient />
    </HydrationBoundary>
  )
}
