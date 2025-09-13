"use client";

import { useCallback, useEffect, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';
import ResultsTable from '@/components/ResultsTable';
import Pagination from '@/components/Pagination';
import Charts from '@/components/Charts';
import SkillSeriesControl from '@/components/SkillSeriesControl';
import CitySkillTrendView from '@/components/CitySkillTrendView';
import JobDetailsModal from '@/components/JobDetailsModal';
import SavedSearches from '@/components/SavedSearches';
import { downloadExcel } from '@/lib/utils/export';
import { AnalyticsResult, JobFilters, JobsResult, MetaFacets, JobItem } from '@/lib/domain/types';
import { fetchAnalytics, fetchJobs, fetchMeta } from '@/lib/utils/api';
import { Container, Stack, Heading, Text, Button, Flex, Box, Checkbox, Alert } from '@chakra-ui/react';

const DEFAULT_PAGE_SIZE = 20;

export default function HomeClient() {
  const [filters, setFilters] = useState<JobFilters>({});
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const [meta, setMeta] = useState<MetaFacets | null>(null);
  const [jobs, setJobs] = useState<JobsResult | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [seriesSkills, setSeriesSkills] = useState<string[] | null>(null);
  const [seriesCustom, setSeriesCustom] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

  // Load meta facets once
  useEffect(() => {
    let mounted = true;
    fetchMeta()
      .then((m) => mounted && setMeta(m))
      .catch((e) => console.error(e));
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch jobs and analytics on filters/page/series change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const doFetch = async () => {
      try {
        const [jr, ar] = await Promise.all([
          fetchJobs({ ...filters, page, pageSize }),
          // Only pass series override when the user customized the selection
          fetchAnalytics(filters, seriesCustom ? (seriesSkills ?? undefined) : undefined),
        ]);
        if (!cancelled) {
          setJobs(jr);
          setAnalytics(ar);
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
  }, [filters, page, pageSize, seriesSkills, seriesCustom]);

  const onSearchChange = useCallback((q: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, q: q || undefined }));
  }, []);

  const onFiltersChange = useCallback((next: JobFilters) => {
    setPage(1);
    setFilters(next);
  }, []);

  const onPageChange = useCallback((p: number) => setPage(p), []);

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
    <Container maxW="7xl" py="lg" minH="100vh">
      <Stack as="header" gap="xs" mb="md">
        <Heading size="lg">Job Stats Explorer</Heading>
        <Text fontSize="sm" color="gray.600">
          Recherchez et filtrez les offres, et explorez les tendances (skills, TJM) à partir de votre dataset fusionné.
        </Text>
      </Stack>

      <Box bg="white" rounded="lg" borderWidth="1px" shadow="sm" p="md">
        <SearchBar value={filters.q} onChange={onSearchChange} />
        <FilterPanel meta={meta} value={filters} onChange={onFiltersChange} />
        <SavedSearches currentFilters={filters} onApply={(f) => onFiltersChange(f)} />
        {loading && <Text fontSize="sm" color="gray.600">Chargement…</Text>}
        {jobs && (
          <Flex align="center" justify="flex-end" gap="sm">
            <Button size="sm" variant="outline" colorPalette="brand" onClick={onExportCurrentPage} disabled={exporting} title="Exporter la page courante en Excel">
              Exporter (page)
            </Button>
            <Button size="sm" variant="solid" colorPalette="brand" onClick={onExportAllFiltered} disabled={exporting} title="Exporter tous les résultats filtrés en Excel">
              Exporter (tous)
            </Button>
          </Flex>
        )}
      </Box>

      {error && (
        <Alert.Root status="error" mb="md">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Erreur</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      <Stack gap="md" mb="lg">

        {jobs && (
          <ResultsTable
            items={jobs.items}
            total={jobs.total}
            onSelect={(it) => setSelectedJob(it)}
          />
        )}
        {jobs && (
          <Pagination
            page={jobs.page}
            pageSize={jobs.pageSize}
            pageCount={jobs.pageCount}
            total={jobs.total}
            onPageChange={onPageChange}
          />
        )}
      </Stack>

      <Stack gap="md" mb="lg">
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
          />
        )}
        <Box fontSize="xs" color="gray.600">
          <Checkbox.Root
            checked={!seriesCustom}
            onCheckedChange={(detail: any) => {
              const auto = !!detail.checked;
              setSeriesCustom(!auto);
              if (auto && analytics) {
                setSeriesSkills(analytics.seriesSkills);
              }
            }}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label>
              Suivre automatiquement le Top 10 (s’adapte aux filtres)
            </Checkbox.Label>
          </Checkbox.Root>
        </Box>
        <Charts data={analytics} />
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
