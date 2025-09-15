'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'

import JobDetailsDrawer from '@/components/organisms/JobDetailsDrawer/JobDetailsDrawer'
const CitySkillTrendView = dynamic(
  () => import('@/components/organisms/CitySkillTrendView/CitySkillTrendView'),
  { ssr: false },
)
import { Button, Container, Heading, Link,Stack, Text } from '@chakra-ui/react'
import { useQueryClient } from '@tanstack/react-query'

import Section from '@/components/molecules/Section/Section'
import type { TrendsOptions } from '@/components/molecules/TrendsControls/TrendsControls'
import FilterDrawer from '@/components/organisms/FilterDrawer/FilterDrawer'
import { useEmerging, useJobs, useMeta, useMetrics, useTopSkills } from '@/features/jobs/api'
import { fetchJobs } from '@/features/jobs/api/endpoints'
import { queryKeys } from '@/features/jobs/api/queryKeys'
import { useExport } from '@/features/jobs/hooks/useExport'
import type { JobFilters } from '@/features/jobs/types/types'
import type { JobItem } from '@/features/jobs/types/types'
import JobsChartsSection from '@/features/jobs/ui/JobsChartsSection'
import JobsResultsSection from '@/features/jobs/ui/JobsResultsSection'

import { type FiltersFormValues,useExplorerState } from './hooks/useExplorerState'

export function JobsPageClient() {
  const { form, filters, deferredFilters, page, setPage, pageSize, setPageSize, sortKey, setSortKey, sortOrder, setSortOrder } = useExplorerState()
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null)
  const [showSaved, setShowSaved] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [seriesSkills, setSeriesSkills] = useState<string[] | null>(null)
  const [seriesCustom, setSeriesCustom] = useState(false)
  const { exporting, exportCurrentPage, exportAllFiltered } = useExport()
  const [trends, setTrends] = useState<TrendsOptions>({
    months: 12,
    topSkillsLimit: 50,
    emergingLimit: 10,
  })

  const { reset } = form
  const metaQuery = useMeta()
  const queryClient = useQueryClient()
  const jobsQuery = useJobs({ page, pageSize, filters: deferredFilters as Partial<JobFilters> })
  const metricsQuery = useMetrics(
    deferredFilters as Partial<JobFilters>,
    seriesCustom ? (seriesSkills ?? undefined) : undefined,
  )
  const topSkillsQuery = useTopSkills(deferredFilters as Partial<JobFilters>)
  const emergingQuery = useEmerging(
    deferredFilters as Partial<JobFilters>,
    trends.emergingLimit,
    12,
    5,
  )

  const jobs = jobsQuery.data ?? null
  const metrics = metricsQuery.data ?? null
  const topSkills50 = topSkillsQuery.data ?? null
  const emerging = emergingQuery.data ?? null
  const meta = metaQuery.data ?? null

  useEffect(() => {
    if (metrics && !seriesCustom) {
      const next = metrics.seriesSkills ?? []
      const cur = seriesSkills ?? []
      const same = next.length === cur.length && next.every((v, i) => v === cur[i])
      if (!same) setSeriesSkills(next)
    }
  }, [metrics, seriesCustom, seriesSkills])

  useEffect(() => {
    if (!jobs) return
    const promises: Promise<unknown>[] = []
    if (jobs.page < jobs.pageCount) {
      const nextFilters = {
        ...(deferredFilters as Partial<JobFilters>),
        page: jobs.page + 1,
        pageSize,
      }
      promises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.jobs(nextFilters),
          queryFn: () => fetchJobs(nextFilters),
        }),
      )
    }
    if (jobs.page > 1) {
      const prevFilters = {
        ...(deferredFilters as Partial<JobFilters>),
        page: jobs.page - 1,
        pageSize,
      }
      promises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.jobs(prevFilters),
          queryFn: () => fetchJobs(prevFilters),
        }),
      )
    }
    void Promise.allSettled(promises)
  }, [jobs, deferredFilters, pageSize, queryClient])

  // keep future-friendly slot for SearchBar to update query
  const onFiltersChange = useCallback(
    (next: FiltersFormValues) => {
      reset(next)
      setPage(1)
    },
    [reset, setPage],
  )
  const onPageChange = useCallback(
    (p: number) => {
      setPage(p)
    },
    [setPage],
  )
  const onPageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size)
      setPage(1)
    },
    [setPageSize, setPage],
  )
  const onSortChange = useCallback(
    (key: NonNullable<typeof sortKey>, order: typeof sortOrder) => {
      setSortKey(key)
      setSortOrder(order)
    },
    [setSortKey, setSortOrder],
  )
  const onClearAllFilters = useCallback(() => {
    reset({})
    setPage(1)
  }, [reset, setPage])

  const onExportCurrentPage = useCallback(() => exportCurrentPage(jobs), [exportCurrentPage, jobs])
  const onExportAllFiltered = useCallback(
    () => exportAllFiltered(filters as Partial<JobFilters>),
    [exportAllFiltered, filters],
  )

  function countActiveFilters(f: Partial<JobFilters> | FiltersFormValues): number {
    const jf = f as Partial<JobFilters>
    let c = 0
    const arr = (v?: unknown) => (Array.isArray(v) ? v.length : 0)

    if (typeof jf.q === 'string' && jf.q.trim()) c++

    c += arr(jf.skills)
    c += arr(jf.excludeSkills)
    c += arr(jf.excludeTitle)
    c += arr(jf.cities)
    c += arr(jf.regions)
    c += arr(jf.remote)
    c += arr(jf.experience)
    c += arr(jf.job_slugs)

    if (jf.cityMatch === 'exact') c++
    if (jf.excludeCities) c++
    if (jf.excludeRegions) c++
    if (typeof jf.minTjm === 'number') c++
    if (typeof jf.maxTjm === 'number') c++
    if (jf.startDate) c++
    if (jf.endDate) c++
    return c
  }

  const activeFiltersCount = useMemo(() => countActiveFilters(filters as JobFilters), [filters])

  return (
    <Container maxW="7xl" py="lg" minH="100vh" position="relative">
      <Link
        href="#results-section"
        position="absolute"
        left="-9999px"
        _focusVisible={{ left: 'sm', top: 'sm', zIndex: 1000 }}
      >
        <Button size="xs" variant="outline">
          Aller aux résultats
        </Button>
      </Link>
      <Stack as="header" gap="xs" mb="md">
        <Heading size="lg">Job Stats Explorer</Heading>
        <Text fontSize="sm" color="gray.600">
          Recherchez, filtrez et explorez les tendances du marché freelance (compétences, TJM).
        </Text>
      </Stack>

      <FilterDrawer
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        meta={meta}
        filters={filters as unknown as JobFilters}
        onChange={onFiltersChange}
      />

      <Stack gap="md" mb="lg">
        <JobsResultsSection
          jobs={jobs}
          isLoading={jobsQuery.isLoading}
          isError={!!jobsQuery.isError}
          error={jobsQuery.error as unknown}
          isFetching={jobsQuery.isFetching}
          filters={filters as unknown as JobFilters}
          onFiltersChange={(f) => onFiltersChange(f as unknown as FiltersFormValues)}
          onClearAllFilters={onClearAllFilters}
          activeFiltersCount={activeFiltersCount}
          onOpenFilters={() => setFiltersOpen(true)}
          showSaved={showSaved}
          onToggleSaved={() => setShowSaved((s) => !s)}
          {...(sortKey ? { sortKey } : {})}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          onSelectJob={(it) => setSelectedJob(it)}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          exporting={exporting}
          onExportCurrentPage={onExportCurrentPage}
          onExportAllFiltered={onExportAllFiltered}
        />
      </Stack>

      <Stack gap="md" mb="lg">
        <JobsChartsSection
          meta={meta}
          metrics={metrics}
          topSkills={topSkills50}
          emerging={emerging}
          seriesSkills={seriesSkills}
          autoSeriesEnabled={!seriesCustom}
          onSeriesChange={(next) => {
            setSeriesSkills(next)
            const tops = metrics?.topSkills ?? []
            const isTopReset = next.length === tops.length && next.every((v, i) => v === tops[i])
            setSeriesCustom(!isTopReset)
          }}
          onToggleAuto={(auto) => {
            setSeriesCustom(!auto)
            if (auto && metrics) setSeriesSkills(metrics.seriesSkills)
          }}
          trends={trends}
          setTrends={(t) => setTrends(t)}
          loading={metricsQuery.isLoading && topSkillsQuery.isLoading && emergingQuery.isLoading}
          fetching={
            metricsQuery.isFetching || topSkillsQuery.isFetching || emergingQuery.isFetching
          }
          errors={{
            metrics: metricsQuery.error,
            topSkills: topSkillsQuery.error,
            emerging: emergingQuery.error,
          }}
          onRetry={() => {
            metricsQuery.refetch()
            topSkillsQuery.refetch()
            emergingQuery.refetch()
          }}
        />
      </Stack>

      <Stack gap="md">
        <Section title="Comparaison par ville" subtitle="Évolution mensuelle d’un skill par ville">
          <CitySkillTrendView
            filters={filters as JobFilters}
            meta={meta}
            {...(metrics?.topSkills?.[0] ? { defaultSkill: metrics.topSkills[0] } : {})}
          />
        </Section>
      </Stack>

      <JobDetailsDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />
    </Container>
  )
}
