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
import SavedSearches from '@/components/SavedSearches';
import { downloadExcel } from '@/lib/utils/export';
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
        <SavedSearches
          currentFilters={filters}
          onApply={(f) => onFiltersChange(f)}
        />
      </section>

      {error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-3 rounded">
          {error}
        </div>
      )}

      <section className="space-y-3">
        {loading && <div className="text-sm text-gray-600">Chargement…</div>}
        {jobs && (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onExportCurrentPage}
              disabled={exporting}
              className="px-3 py-2 rounded border border-gray-200 dark:border-zinc-800 text-sm"
              title="Exporter la page courante en Excel"
            >
              Exporter (page)
            </button>
            <button
              type="button"
              onClick={onExportAllFiltered}
              disabled={exporting}
              className="px-3 py-2 rounded border border-gray-200 dark:border-zinc-800 text-sm"
              title="Exporter tous les résultats filtrés en Excel"
            >
              Exporter (tous)
            </button>
          </div>
        )}
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
        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!seriesCustom}
              onChange={(e) => {
                const auto = e.target.checked;
                setSeriesCustom(!auto);
                if (auto && analytics) {
                  // immediately sync to current server-provided series
                  setSeriesSkills(analytics.seriesSkills);
                }
              }}
            />
            Suivre automatiquement le Top 10 (s’adapte aux filtres)
          </label>
        </div>
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
