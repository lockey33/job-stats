"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';
import ResultsTable from '@/components/ResultsTable';
import Pagination from '@/components/Pagination';
import Charts from '@/components/Charts';
import SkillSeriesControl from '@/components/SkillSeriesControl';
import CitySkillTrendView from '@/components/CitySkillTrendView';
import JobDetailsModal from '@/components/JobDetailsModal';
import { AnalyticsResult, JobFilters, JobsResult, MetaFacets, JobItem } from '@/lib/domain/types';
import { fetchAnalytics, fetchJobs, fetchMeta } from '@/lib/utils/api';

const DEFAULT_PAGE_SIZE = 20;

export default function HomeClient() {
  const [filters, setFilters] = useState<JobFilters>({});
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  const [meta, setMeta] = useState<MetaFacets | null>(null);
  const [jobs, setJobs] = useState<JobsResult | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [seriesSkills, setSeriesSkills] = useState<string[] | null>(null);
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
          fetchAnalytics(filters, seriesSkills ?? undefined),
        ]);
        if (!cancelled) {
          setJobs(jr);
          setAnalytics(ar);
          // Initialize seriesSkills on first load using server-provided series
          if (seriesSkills === null) {
            setSeriesSkills(ar.seriesSkills);
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
  }, [filters, page, pageSize, seriesSkills]);

  const onSearchChange = useCallback((q: string) => {
    setPage(1);
    setFilters((f) => ({ ...f, q: q || undefined }));
  }, []);

  const onFiltersChange = useCallback((next: JobFilters) => {
    setPage(1);
    setFilters(next);
  }, []);

  const onPageChange = useCallback((p: number) => setPage(p), []);

  return (
    <div className="min-h-screen w-full max-w-7xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Job Stats Explorer</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Recherchez et filtrez les offres, et explorez les tendances (skills, TJM) à partir de votre dataset fusionné.
        </p>
      </header>

      <section className="space-y-4">
        <SearchBar value={filters.q} onChange={onSearchChange} />
        <FilterPanel meta={meta} value={filters} onChange={onFiltersChange} />
      </section>

      {error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-3 rounded">
          {error}
        </div>
      )}

      <section className="space-y-3">
        {loading && <div className="text-sm text-gray-600">Chargement…</div>}
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
      </section>

      <section className="space-y-3">
        {meta && (
          <SkillSeriesControl
            options={meta.skills}
            value={seriesSkills ?? []}
            onChange={(next) => setSeriesSkills(next)}
            topSkills={analytics?.topSkills}
          />
        )}
        <Charts data={analytics} />
      </section>

      <section className="space-y-3">
        <CitySkillTrendView
          filters={filters}
          meta={meta}
          defaultSkill={analytics?.topSkills?.[0]}
        />
      </section>

      {/* Job details modal */}
      <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
