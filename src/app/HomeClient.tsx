"use client";

import { useCallback, useEffect, useState } from 'react';
import SearchBar from '@/components/molecules/SearchBar/SearchBar';
import FilterPanel from '@/components/organisms/FilterPanel/FilterPanel';
import ResultsTable from '@/components/organisms/ResultsTable/ResultsTable';
import Pagination from '@/components/molecules/Pagination/Pagination';
import Charts from '@/components/organisms/Charts/Charts';
import SkillSeriesControl from '@/components/molecules/SkillSeriesControl/SkillSeriesControl';
import CitySkillTrendView from '@/components/organisms/CitySkillTrendView/CitySkillTrendView';
import JobDetailsModal from '@/components/organisms/JobDetailsModal/JobDetailsModal';
import SavedSearches from '@/components/organisms/SavedSearches/SavedSearches';
import ResultsToolbar from '@/components/molecules/ResultsToolbar/ResultsToolbar';
import AppliedFiltersChips from '@/components/molecules/AppliedFiltersChips/AppliedFiltersChips';
import ResultsSkeleton from '@/components/organisms/ResultsSkeleton/ResultsSkeleton';
import ChartsSkeleton from '@/components/organisms/ChartsSkeleton/ChartsSkeleton';
import { downloadExcel } from '@/lib/utils/export';
import { parseFiltersFromSearchParams, toQueryString } from '@/lib/utils/filters';
import { AnalyticsResult, JobFilters, JobsResult, MetaFacets, JobItem } from '@/lib/domain/types';
import { fetchAnalytics, fetchJobs, fetchMeta } from '@/lib/utils/api';
import { Container, Stack, Heading, Text, Button, Box, Alert, HStack, Link } from '@chakra-ui/react';

const DEFAULT_PAGE_SIZE = 20;

export default function HomeClient() {
  const [filters, setFilters] = useState<JobFilters>({});
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [sortKey, setSortKey] = useState<'title' | 'company' | 'city' | 'experience' | 'tjm' | 'date' | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [meta, setMeta] = useState<MetaFacets | null>(null);
  const [jobs, setJobs] = useState<JobsResult | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [seriesSkills, setSeriesSkills] = useState<string[] | null>(null);
  const [seriesCustom, setSeriesCustom] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [showSaved, setShowSaved] = useState<boolean>(false);
  const [debouncedFilters, setDebouncedFilters] = useState<JobFilters>({});
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const [prefetch, setPrefetch] = useState<Record<number, JobsResult>>({});

  // Load meta facets once
  useEffect(() => {
    let mounted = true;
    // Hydrate state from URL on first mount
    try {
      const params = new URLSearchParams(window.location.search);
      const parsed = parseFiltersFromSearchParams(params);
      setFilters((f) => ({ ...f, ...parsed }));
      setPage(parsed.page || 1);
      setPageSize(parsed.pageSize || DEFAULT_PAGE_SIZE);
      // Sort state
      const sk = params.get('sortKey') as 'title' | 'company' | 'city' | 'experience' | 'tjm' | 'date' | null;
      const so = params.get('sortOrder') as 'asc' | 'desc' | null;
      if (sk) setSortKey(sk);
      if (so === 'asc' || so === 'desc') setSortOrder(so);
    } catch {
      // ignore URL parse errors
    }
    fetchMeta()
      .then((m) => mounted && setMeta(m))
      .catch((e) => console.error(e));
    return () => {
      mounted = false;
    };
  }, []);

  // Debounce filters to limit fetch churn
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);
    return () => clearTimeout(t);
  }, [filters]);

  // Sync filters/page/pageSize to URL
  useEffect(() => {
    const qs = toQueryString({ ...filters, page, pageSize });
    const extra = [
      sortKey ? `sortKey=${encodeURIComponent(sortKey)}` : null,
      sortOrder ? `sortOrder=${encodeURIComponent(sortOrder)}` : null,
    ].filter(Boolean).join('&');
    const full = [qs, extra].filter(Boolean).join('&');
    const url = full ? `?${full}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [filters, page, pageSize, sortKey, sortOrder]);

  // Fetch jobs and analytics on filters/page/series change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const doFetch = async () => {
      try {
        const [jr, ar] = await Promise.all([
          fetchJobs({ ...debouncedFilters, page, pageSize }),
          // Only pass series override when the user customized the selection
          fetchAnalytics(debouncedFilters, seriesCustom ? (seriesSkills ?? undefined) : undefined),
        ]);
        if (!cancelled) {
          setJobs(jr);
          setAnalytics(ar);
          // Prefetch next page to improve perceived performance
          if (jr.page < jr.pageCount) {
            const nextPage = jr.page + 1;
            fetchJobs({ ...debouncedFilters, page: nextPage, pageSize })
              .then((nextResult) => {
                setPrefetch((m) => ({ ...m, [nextPage]: nextResult }));
              })
              .catch(() => { /* ignore prefetch errors */ });
          }
          // Prefetch previous page
          if (jr.page > 1) {
            const prevPage = jr.page - 1;
            fetchJobs({ ...debouncedFilters, page: prevPage, pageSize })
              .then((prevResult) => {
                setPrefetch((m) => ({ ...m, [prevPage]: prevResult }));
              })
              .catch(() => { /* ignore prefetch errors */ });
          }
          // When not in custom mode, always follow server-provided series (top skills based on current filters)
          if (!seriesCustom) {
            const next = ar.seriesSkills;
            const same = Array.isArray(seriesSkills)
              && seriesSkills.length === next.length
              && seriesSkills.every((v, i) => v === next[i]);
            if (!same) setSeriesSkills(next);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Erreur inattendue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doFetch();

    return () => {
      cancelled = true;
    };
  }, [debouncedFilters, page, pageSize, seriesSkills, seriesCustom, refreshTick]);

  const onSearchChange = useCallback((q: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, q: q || undefined }));
  }, []);

  const onFiltersChange = useCallback((next: JobFilters) => {
    setPage(1);
    setFilters(next);
  }, []);

  const onPageChange = useCallback((p: number) => {
    // If we have a prefetched result for this page, use it immediately to avoid flicker
    setPage(p);
    setJobs((cur) => {
      const cached = prefetch[p];
      return cached ? cached : cur;
    });
  }, [prefetch]);

  const onPageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const onSortChange = useCallback((key: 'title' | 'company' | 'city' | 'experience' | 'tjm' | 'date', order: 'asc' | 'desc') => {
    setSortKey(key);
    setSortOrder(order);
  }, []);

  const onRetry = useCallback(() => setRefreshTick((x) => x + 1), []);
  const onClearAllFilters = useCallback(() => {
    setPage(1);
    setFilters({});
  }, []);

  // Export utilities
  function jobItemToRow(it: JobItem) {
    return {
      id: it.id,
      date: it.created_at?.slice(0, 10) ?? '',
      title: it.title ?? it.slug ?? it.job_slug ?? '',
      company: it.company_name ?? '',
      city: it.city ?? '',
      remote: it.remote ?? '',
      experience: it.experience ?? '',
      min_tjm: it.min_tjm ?? '',
      max_tjm: it.max_tjm ?? '',
      skills: (it.skills ?? []).join(' | '),
      soft_skills: (it.soft_skills ?? []).join(' | '),
      job_slug: it.job_slug ?? '',
    };
  }

  const [exporting, setExporting] = useState(false);

  const onExportCurrentPage = useCallback(async () => {
    if (!jobs) return;
    try {
      setExporting(true);
      const rows = jobs.items.map(jobItemToRow);
      const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
      await downloadExcel(rows, 'Jobs', `jobs_page_${jobs.page}_${ts}.xlsx`);
    } finally {
      setExporting(false);
    }
  }, [jobs]);

  const onExportAllFiltered = useCallback(async () => {
    try {
      setExporting(true);
      // Fetch all pages sequentially to avoid overloading
      const first = jobs ?? await fetchJobs({ ...filters, page: 1, pageSize });
      const allItems = [...(first?.items ?? [])];
      const pageCount = first?.pageCount ?? 1;
      for (let p = 2; p <= pageCount; p++) {
        const r = await fetchJobs({ ...filters, page: p, pageSize });
        allItems.push(...r.items);
      }
      const rows = allItems.map(jobItemToRow);
      const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
      await downloadExcel(rows, 'Jobs', `jobs_all_${ts}.xlsx`);
    } finally {
      setExporting(false);
    }
  }, [jobs, filters, pageSize]);

  return (
    <Container maxW="7xl" py="lg" minH="100vh" position="relative">
      <Link
        href="#results-section"
        position="absolute"
        left="-9999px"
        _focusVisible={{ left: 'sm', top: 'sm', zIndex: 1000 }}
      >
        <Button size="xs" variant="outline">Aller aux résultats</Button>
      </Link>
      <Stack as="header" gap="xs" mb="md">
        <Heading size="lg">Job Stats Explorer</Heading>
        <Text fontSize="sm" color="gray.600">
          Recherchez et filtrez les offres, et explorez les tendances (skills, TJM) à partir de votre dataset fusionné.
        </Text>
      </Stack>

      <Box bg="white" rounded="lg" borderWidth="1px" shadow="sm" p="md">
        <HStack justify="space-between" align="center" mb="sm">

          <SearchBar value={filters.q} onChange={onSearchChange} />
          <Button
            display={{ base: 'inline-flex', md: 'none' }}
            size="sm"
            variant="outline"
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {filtersOpen ? 'Masquer filtres' : 'Filtres'}
          </Button>
        </HStack>
        <Box display={{ base: filtersOpen ? 'block' : 'none', md: 'block' }}>
          <FilterPanel meta={meta} value={filters} onChange={onFiltersChange} />
        </Box>
        {showSaved && (
          <SavedSearches currentFilters={filters} onApply={(f) => onFiltersChange(f)} />
        )}
        <AppliedFiltersChips value={filters} onChange={onFiltersChange} onClearAll={onClearAllFilters} />
      </Box>

      {error && (
        <Alert.Root status="error" mb="md">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Erreur</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
            <Box mt="sm">
              <Button size="sm" onClick={onRetry} variant="outline" colorPalette="brand">Réessayer</Button>
            </Box>
          </Alert.Content>
        </Alert.Root>
      )}

      <Stack gap="md" mb="lg">

        {loading && !jobs && (
          <ResultsSkeleton />
        )}
        {!loading && jobs && jobs.total > 0 && (
          <>
            <Box id="results-section" />
            <ResultsToolbar
              total={jobs.total}
              exporting={exporting}
              onExportCurrentPage={onExportCurrentPage}
              onExportAllFiltered={onExportAllFiltered}
              rightSlot={
                <Button size="sm" variant="outline" onClick={() => setShowSaved((v) => !v)}>
                  {showSaved ? 'Masquer « Sauver »' : 'Sauver cette recherche'}
                </Button>
              }
            />
            <ResultsTable
              items={jobs.items}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onSortChange={onSortChange}
              onSelect={(it) => setSelectedJob(it)}
            />
            <Pagination
              page={jobs.page}
              pageSize={jobs.pageSize}
              pageCount={jobs.pageCount}
              total={jobs.total}
              onPageChange={onPageChange}
              pageSizeOptions={[10, 20, 50]}
              onPageSizeChange={onPageSizeChange}
            />
          </>
        )}
        {!loading && jobs && jobs.total === 0 && (
          <Box textAlign="center" color="gray.700" py="lg" borderWidth="1px" rounded="lg">
            <Text fontWeight="medium" mb="xs">Aucun résultat</Text>
            <Text fontSize="sm" color="gray.600" mb="sm">Essayez d’assouplir ou de réinitialiser vos filtres.</Text>
            <Button size="sm" onClick={onClearAllFilters} variant="outline" colorPalette="brand">Réinitialiser les filtres</Button>
          </Box>
        )}
      </Stack>

      <Stack gap="md" mb="lg">
        {loading ? (
          <ChartsSkeleton />
        ) : (
          <>
            {meta && (
              <SkillSeriesControl
                options={meta.skills}
                value={seriesSkills ?? []}
                onChange={(next) => {
                  setSeriesSkills(next);
                  // If user reset to current top skills, go back to auto mode; otherwise custom
                  const tops = analytics?.topSkills ?? [];
                  const isTopReset = next.length === tops.length && next.every((v, i) => v === tops[i]);
                  setSeriesCustom(!isTopReset);
                }}
                topSkills={analytics?.topSkills}
                autoEnabled={!seriesCustom}
                onToggleAuto={(auto) => {
                  setSeriesCustom(!auto);
                  if (auto && analytics) {
                    setSeriesSkills(analytics.seriesSkills);
                  }
                }}
                onPresetTop={(count) => {
                  const tops = analytics?.topSkills ?? [];
                  if (tops.length > 0) {
                    setSeriesSkills(tops.slice(0, Math.min(count, tops.length)));
                    setSeriesCustom(true);
                  }
                }}
              />
            )}
            <Charts data={analytics} />
          </>
        )}
      </Stack>

      <Stack gap="md">
        <CitySkillTrendView
          filters={filters}
          meta={meta}
          defaultSkill={analytics?.topSkills?.[0]}
        />
      </Stack>

      {/* Job details modal */}
      <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </Container>
  );
}
