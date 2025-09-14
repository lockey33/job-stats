"use client";

import { useCallback, useEffect, useState } from 'react';
import SearchBar from '@/components/molecules/SearchBar/SearchBar';
import FilterPanel from '@/components/organisms/FilterPanel/FilterPanel';
import ResultsTable from '@/components/organisms/ResultsTable/ResultsTable';
import Pagination from '@/components/molecules/Pagination/Pagination';
import dynamic from 'next/dynamic';
import SkillSeriesControl from '@/components/molecules/SkillSeriesControl/SkillSeriesControl';
import JobDetailsModal from '@/components/organisms/JobDetailsModal/JobDetailsModal';
import SavedSearches from '@/components/organisms/SavedSearches/SavedSearches';
import ResultsToolbar from '@/components/molecules/ResultsToolbar/ResultsToolbar';
import AppliedFiltersChips from '@/components/molecules/AppliedFiltersChips/AppliedFiltersChips';
import ResultsSkeleton from '@/components/organisms/ResultsSkeleton/ResultsSkeleton';
import ChartsSkeleton from '@/components/organisms/ChartsSkeleton/ChartsSkeleton';
// Heavy charts: lazy-load on client to reduce initial JS and hydration
const Charts = dynamic(() => import('@/components/organisms/Charts/Charts'), { ssr: false, loading: () => <ChartsSkeleton /> });
const TopSkillsBarChart = dynamic(() => import('@/components/organisms/TopSkillsBarChart/TopSkillsBarChart'), { ssr: false });
const EmergingSkillsChart = dynamic(() => import('@/components/organisms/EmergingSkillsChart/EmergingSkillsChart'), { ssr: false });
const CitySkillTrendView = dynamic(() => import('@/components/organisms/CitySkillTrendView/CitySkillTrendView'), { ssr: false });
import { Container, Stack, Heading, Text, Button, Box, Alert, HStack, Link } from '@chakra-ui/react';
import LoadingOverlay from '@/components/atoms/LoadingOverlay/LoadingOverlay';
import { downloadExcel, downloadBlob } from '@/shared/utils/export';
import { fetchJobs } from '@/features/jobs/api/endpoints';
import { toQueryString } from '@/shared/utils/searchParams';
import { JobFilters } from '@/features/jobs/types/types';
import { useQueryClient } from '@tanstack/react-query';
import { useExplorerState, type FiltersFormValues } from './hooks/useExplorerState';
import { useEmerging, useJobs, useMeta, useMetrics, useTopSkills } from '@/features/jobs/api';
import { jobItemToRow } from '@/features/jobs/utils/transformers';
import { JobItem } from '@/features/jobs/types/types';

export default function JobsPage() {
  const { form, filters, deferredFilters, page, setPage, pageSize, setPageSize, sortKey, setSortKey, sortOrder, setSortOrder } = useExplorerState();
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [seriesSkills, setSeriesSkills] = useState<string[] | null>(null);
  const [seriesCustom, setSeriesCustom] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { reset, setValue } = form;
  const metaQuery = useMeta();
  const queryClient = useQueryClient();
  const jobsQuery = useJobs({ page, pageSize, filters: deferredFilters as Partial<JobFilters> });
  const metricsQuery = useMetrics(deferredFilters as Partial<JobFilters>, seriesCustom ? (seriesSkills ?? undefined) : undefined);
  const topSkillsQuery = useTopSkills(deferredFilters as Partial<JobFilters>);
  const emergingQuery = useEmerging(deferredFilters as Partial<JobFilters>);

  const jobs = jobsQuery.data ?? null;
  const metrics = metricsQuery.data ?? null;
  const topSkills50 = topSkillsQuery.data ?? null;
  const emerging = emergingQuery.data ?? null;
  const meta = metaQuery.data ?? null;

  useEffect(() => {
    if (metrics && !seriesCustom) {
      const next = metrics.seriesSkills ?? [];
      const cur = seriesSkills ?? [];
      const same = next.length === cur.length && next.every((v, i) => v === cur[i]);
      if (!same) setSeriesSkills(next);
    }
  }, [metrics, seriesCustom, seriesSkills]);

  useEffect(() => {
    if (!jobs) return;
    const promises: Promise<unknown>[] = [];
    if (jobs.page < jobs.pageCount) {
      const nextFilters = { ...(deferredFilters as Partial<JobFilters>), page: jobs.page + 1, pageSize };
      promises.push(queryClient.prefetchQuery({ queryKey: ['jobs', nextFilters], queryFn: () => fetchJobs(nextFilters) }));
    }
    if (jobs.page > 1) {
      const prevFilters = { ...(deferredFilters as Partial<JobFilters>), page: jobs.page - 1, pageSize };
      promises.push(queryClient.prefetchQuery({ queryKey: ['jobs', prevFilters], queryFn: () => fetchJobs(prevFilters) }));
    }
    void Promise.allSettled(promises);
  }, [jobs, deferredFilters, pageSize, queryClient]);

  const onSearchChange = useCallback((q: string) => { setValue('q', q || undefined, { shouldDirty: true, shouldTouch: false }); setPage(1); }, [setValue, setPage]);
  const onFiltersChange = useCallback((next: FiltersFormValues) => { reset(next); setPage(1); }, [reset, setPage]);
  const onPageChange = useCallback((p: number) => { setPage(p); }, [setPage]);
  const onPageSizeChange = useCallback((size: number) => { setPageSize(size); setPage(1); }, [setPageSize, setPage]);
  const onSortChange = useCallback((key: NonNullable<typeof sortKey>, order: typeof sortOrder) => { setSortKey(key); setSortOrder(order); }, [setSortKey, setSortOrder]);
  const onClearAllFilters = useCallback(() => { reset({}); setPage(1); }, [reset, setPage]);

  const onExportCurrentPage = useCallback(async () => {
    if (!jobs) return;
    try { setExporting(true); const rows = jobs.items.map(jobItemToRow); const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); await downloadExcel(rows, 'Jobs', `jobs_page_${jobs.page}_${ts}.xlsx`); }
    finally { setExporting(false); }
  }, [jobs]);

  const onExportAllFiltered = useCallback(async () => {
    try {
      setExporting(true);
      const qsCore = toQueryString(filters as Partial<JobFilters>);
      const res = await fetch(`/api/export?${qsCore}`);
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const match = /filename="?([^";]+)"?/i.exec(cd || '');
      const filename = match?.[1] || `jobs_all_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)}.xlsx`;
      downloadBlob(filename, blob.type || 'application/octet-stream', blob);
    } finally { setExporting(false); }
  }, [filters]);

  return (
    <Container maxW="7xl" py="lg" minH="100vh" position="relative">
      <Link href="#results-section" position="absolute" left="-9999px" _focusVisible={{ left: 'sm', top: 'sm', zIndex: 1000 }}>
        <Button size="xs" variant="outline">Aller aux résultats</Button>
      </Link>
      <Stack as="header" gap="xs" mb="md">
        <Heading size="lg">Job Stats Explorer</Heading>
        <Text fontSize="sm" color="gray.600">Recherchez et filtrez les offres, et explorez les tendances (skills, TJM) à partir de votre dataset fusionné.</Text>
      </Stack>

      <Box bg="white" rounded="lg" borderWidth="1px" shadow="sm" p="md">
        <HStack justify="space-between" align="center" mb="sm">
          <SearchBar value={filters.q} onChange={onSearchChange} />
          <Button display={{ base: 'inline-flex', md: 'none' }} size="sm" variant="outline" onClick={() => setFiltersOpen(!filtersOpen)}>
            {filtersOpen ? 'Masquer filtres' : 'Filtres'}
          </Button>
        </HStack>
        <Box display={{ base: filtersOpen ? 'block' : 'none', md: 'block' }}>
          <FilterPanel meta={meta} value={filters as unknown as JobFilters} onChange={onFiltersChange} />
        </Box>
        {showSaved && (<SavedSearches currentFilters={filters} onApply={(f) => onFiltersChange(f)} />)}
        <AppliedFiltersChips value={filters} onChange={onFiltersChange} onClearAll={onClearAllFilters} />
      </Box>

      <Stack gap="md" mb="lg">
        {jobsQuery.isLoading && !jobs && (<ResultsSkeleton />)}
        {jobsQuery.isError && (
          <Alert.Root status="error" mb="md">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Erreur résultats</Alert.Title>
              <Alert.Description>{String((jobsQuery.error as Error)?.message ?? jobsQuery.error)}</Alert.Description>
              <Box mt="sm"><Button size="sm" onClick={() => jobsQuery.refetch()} variant="outline" colorPalette="brand">Réessayer</Button></Box>
            </Alert.Content>
          </Alert.Root>
        )}
        {!jobsQuery.isLoading && !jobsQuery.isError && jobs && jobs.total > 0 && (
          <Box position="relative">
            {jobsQuery.isFetching && <LoadingOverlay text="Mise à jour des résultats…" />}
            <Box id="results-section" />
            <ResultsToolbar total={jobs.total} exporting={exporting} onExportCurrentPage={onExportCurrentPage} onExportAllFiltered={onExportAllFiltered}
              rightSlot={<Button size="sm" variant="outline" onClick={() => setShowSaved(!showSaved)}>{showSaved ? 'Masquer « Sauver »' : 'Sauver cette recherche'}</Button>}
            />
            <ResultsTable items={jobs.items} sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} onSelect={(it) => setSelectedJob(it)} />
            <Pagination page={jobs.page} pageSize={jobs.pageSize} pageCount={jobs.pageCount} total={jobs.total} onPageChange={onPageChange} pageSizeOptions={[10, 20, 50]} onPageSizeChange={onPageSizeChange} />
          </Box>
        )}
        {!jobsQuery.isLoading && !jobsQuery.isError && jobs && jobs.total === 0 && (
          <Box textAlign="center" color="gray.700" py="lg" borderWidth="1px" rounded="lg">
            <Text fontWeight="medium" mb="xs">Aucun résultat</Text>
            <Text fontSize="sm" color="gray.600" mb="sm">Essayez d’assouplir ou de réinitialiser vos filtres.</Text>
            <Button size="sm" onClick={onClearAllFilters} variant="outline" colorPalette="brand">Réinitialiser les filtres</Button>
          </Box>
        )}
      </Stack>

      <Stack gap="md" mb="lg">
        {metricsQuery.isLoading && topSkillsQuery.isLoading && emergingQuery.isLoading ? (
          <ChartsSkeleton />
        ) : (
          <Box position="relative">
            {(metricsQuery.isFetching || topSkillsQuery.isFetching || emergingQuery.isFetching) && (
              <LoadingOverlay text="Mise à jour des graphiques…" />
            )}
            {(metricsQuery.isError || topSkillsQuery.isError || emergingQuery.isError) && (
              <Alert.Root status="warning" mb="md">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Certains graphiques n&apos;ont pas pu être chargés</Alert.Title>
                  <Alert.Description>
                    {metricsQuery.isError && <div>Metrics: {String((metricsQuery.error as Error)?.message ?? metricsQuery.error)}</div>}
                    {topSkillsQuery.isError && <div>Top skills: {String((topSkillsQuery.error as Error)?.message ?? topSkillsQuery.error)}</div>}
                    {emergingQuery.isError && <div>Émergentes: {String((emergingQuery.error as Error)?.message ?? emergingQuery.error)}</div>}
                  </Alert.Description>
                  <Box mt="sm"><Button size="sm" onClick={() => { metricsQuery.refetch(); topSkillsQuery.refetch(); emergingQuery.refetch(); }} variant="outline" colorPalette="brand">Réessayer</Button></Box>
                </Alert.Content>
              </Alert.Root>
            )}
            {meta && (
              <SkillSeriesControl
                options={meta.skills}
                value={seriesSkills ?? []}
                onChange={(next) => {
                  setSeriesSkills(next);
                  const tops = metrics?.topSkills ?? [];
                  const isTopReset = next.length === tops.length && next.every((v, i) => v === tops[i]);
                  setSeriesCustom(!isTopReset);
                }}
                topSkills={metrics?.topSkills}
                autoEnabled={!seriesCustom}
                onToggleAuto={(auto) => {
                  setSeriesCustom(!auto);
                  if (auto && metrics) {
                    setSeriesSkills(metrics.seriesSkills);
                  }
                }}
                onPresetTop={(count) => {
                  const tops = metrics?.topSkills ?? [];
                  if (tops.length > 0) {
                    setSeriesSkills(tops.slice(0, Math.min(count, tops.length)));
                    setSeriesCustom(true);
                  }
                }}
              />
            )}
            <Charts metrics={metrics} />
            <TopSkillsBarChart data={topSkills50 ?? null} />
            <EmergingSkillsChart payload={emerging ?? null} />
          </Box>
        )}
      </Stack>

      <Stack gap="md">
        <CitySkillTrendView filters={filters as JobFilters} meta={meta} defaultSkill={metrics?.topSkills?.[0]} />
      </Stack>

      <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </Container>
  );
}
