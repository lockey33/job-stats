import { JobsResult, JobFilters, AnalyticsResult, MetaFacets } from '@/lib/domain/types';
import { toQueryString } from '@/lib/utils/filters';

export async function fetchJobs(filters: Partial<JobFilters & { page: number; pageSize: number }> = {}): Promise<JobsResult> {
  const qs = toQueryString(filters);
  const res = await fetch(`/api/jobs?${qs}`);
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  return res.json();
}

export async function fetchAnalytics(filters: Partial<JobFilters> = {}, seriesSkills?: string[]): Promise<AnalyticsResult> {
  const qs = toQueryString(filters as any);
  const parts: string[] = [];
  if (qs) parts.push(qs);
  if (seriesSkills && seriesSkills.length > 0) {
    parts.push(`seriesSkills=${encodeURIComponent(seriesSkills.join(','))}`);
  }
  const url = parts.length > 0 ? `/api/analytics?${parts.join('&')}` : `/api/analytics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
  return res.json();
}

export async function fetchMeta(): Promise<MetaFacets> {
  const res = await fetch(`/api/meta`);
  if (!res.ok) throw new Error(`Failed to fetch meta: ${res.status}`);
  return res.json();
}

export interface CitySkillTrendPayload {
  months: string[];
  citySeries: Record<string, { month: string; value: number }[]>;
  topCities: string[];
}

export async function fetchCitySkillTrend(
  filters: Partial<JobFilters> = {},
  skill: string,
  seriesCities?: string[],
  topCityCount?: number,
): Promise<CitySkillTrendPayload> {
  const qs = toQueryString(filters as any);
  const parts: string[] = [];
  if (qs) parts.push(qs);
  parts.push(`skill=${encodeURIComponent(skill)}`);
  if (seriesCities && seriesCities.length > 0) parts.push(`seriesCities=${encodeURIComponent(seriesCities.join(','))}`);
  if (topCityCount) parts.push(`topCityCount=${encodeURIComponent(String(topCityCount))}`);
  const url = `/api/analytics/city-skill?${parts.join('&')}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch city-skill trend: ${res.status}`);
  return res.json();
}
