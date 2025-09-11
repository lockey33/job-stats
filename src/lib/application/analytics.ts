import { JobFilters, JobItem, AnalyticsResult, MonthlyPoint, SkillsSeriesPoint } from '@/lib/domain/types';
import { applyFilters, dedupeById } from './filtering';

function monthKey(iso: string | undefined | null): string | null {
  if (!iso) return null;
  // Expecting 2025-02-11... → 2025-02
  if (iso.length >= 7) return iso.slice(0, 7);
  return null;
}

function norm(s?: string | null): string {
  return (s ?? '').toString().toLowerCase();
}

function normCityLocal(s?: string | null): string {
  let v = norm(s);
  v = v.replace(/\([^)]*\)/g, ' ');
  v = v.replace(/\s+/g, ' ').trim();
  return v;
}

export interface CitySkillTrendResult {
  months: string[];
  citySeries: Record<string, MonthlyPoint[]>; // city -> [{month, value}]
  topCities: string[]; // top cities by total occurrences for the skill (within filters)
}

export function computeCitySkillTrend(
  allJobs: JobItem[],
  filters: JobFilters,
  skill: string,
  cities?: string[],
  topCityCount = 5,
): CitySkillTrendResult {
  const skillNorm = norm(skill);
  if (!skillNorm) return { months: [], citySeries: {}, topCities: [] };

  // We'll compute using per-city filtering consistent with applyFilters logic
  const jobs = dedupeById(applyFilters(allJobs, { ...filters }));

  // Build months
  const monthSet = new Set<string>();
  const cityMonthCounts: Record<string, Record<string, number>> = {};
  const totalsByCity: Record<string, number> = {};

  for (const j of jobs) {
    const mk = j.created_at && j.created_at.length >= 7 ? j.created_at.slice(0, 7) : null;
    if (!mk) continue;
    monthSet.add(mk);

    const hasSkill = (j.skills ?? []).some((s) => norm(s) === skillNorm);
    if (!hasSkill) continue;

    const cityRaw = j.city ?? '—';
    const cityKey = cities && cities.length > 0
      ? (cities.find((c) => normCityLocal(cityRaw).includes(normCityLocal(c))) || null)
      : cityRaw;
    if (!cityKey) continue;

    if (!cityMonthCounts[cityKey]) cityMonthCounts[cityKey] = {};
    cityMonthCounts[cityKey][mk] = (cityMonthCounts[cityKey][mk] ?? 0) + 1;
    totalsByCity[cityKey] = (totalsByCity[cityKey] ?? 0) + 1;
  }

  const months = Array.from(monthSet).sort();

  let seriesCities = Object.keys(cityMonthCounts);
  if (!seriesCities.length && cities && cities.length > 0) {
    // ensure requested cities appear even if empty, to draw zero-lines
    seriesCities = cities.slice();
  }

  let topCities: string[] = [];
  if (!cities || cities.length === 0) {
    topCities = Object.entries(totalsByCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topCityCount)
      .map(([city]) => city);
    seriesCities = topCities;
  } else {
    topCities = Object.entries(totalsByCity)
      .sort((a, b) => b[1] - a[1])
      .map(([city]) => city);
  }

  const citySeries: Record<string, MonthlyPoint[]> = {};
  for (const city of seriesCities) {
    const counts = cityMonthCounts[city] ?? {};
    citySeries[city] = months.map((m) => ({ month: m, value: counts[m] ?? 0 }));
  }

  return { months, citySeries, topCities };
}

function itemTjmApprox(item: JobItem): number | null {
  const { min_tjm, max_tjm } = item;
  if (typeof min_tjm === 'number' && typeof max_tjm === 'number') return (min_tjm + max_tjm) / 2;
  if (typeof min_tjm === 'number') return min_tjm;
  if (typeof max_tjm === 'number') return max_tjm;
  return null;
}

export function computeAnalytics(
  allJobs: JobItem[],
  filters: JobFilters,
  topSkillsCount = 10,
  seriesOverride?: string[]
): AnalyticsResult {
  const jobs = dedupeById(applyFilters(allJobs, filters));

  // Build month axis
  const monthSet = new Set<string>();
  const tjmByMonth: Record<string, { sum: number; count: number }> = {};
  const postingsByMonth: Record<string, number> = {};
  const skillTotals: Record<string, number> = {};
  const skillsByMonth: Record<string, Record<string, number>> = {};

  for (const j of jobs) {
    const mk = monthKey(j.created_at);
    if (!mk) continue;
    monthSet.add(mk);
    postingsByMonth[mk] = (postingsByMonth[mk] ?? 0) + 1;

    // TJM
    const tjm = itemTjmApprox(j);
    if (tjm != null) {
      if (!tjmByMonth[mk]) tjmByMonth[mk] = { sum: 0, count: 0 };
      tjmByMonth[mk].sum += tjm;
      tjmByMonth[mk].count += 1;
    }

    // Skills
    const skills = j.skills ?? [];
    for (const s of skills) {
      if (!s) continue;
      skillTotals[s] = (skillTotals[s] ?? 0) + 1;
      if (!skillsByMonth[mk]) skillsByMonth[mk] = {};
      skillsByMonth[mk][s] = (skillsByMonth[mk][s] ?? 0) + 1;
    }
  }

  const months = Array.from(monthSet).sort();

  const postingsPerMonth: MonthlyPoint[] = months.map((m) => ({ month: m, value: postingsByMonth[m] ?? 0 }));
  const avgTjmPerMonth: MonthlyPoint[] = months.map((m) => {
    const e = tjmByMonth[m];
    const v = e && e.count > 0 ? e.sum / e.count : 0;
    return { month: m, value: Number(v.toFixed(2)) };
  });

  const topSkills = Object.entries(skillTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topSkillsCount)
    .map(([s]) => s);

  const seriesSkills = (seriesOverride && seriesOverride.length > 0)
    ? Array.from(new Set(seriesOverride))
    : topSkills;

  const skillsPerMonth: SkillsSeriesPoint[] = months.map((m) => {
    const row: SkillsSeriesPoint = { month: m };
    for (const s of seriesSkills) {
      row[s] = skillsByMonth[m]?.[s] ?? 0;
    }
    return row;
  });

  return { months, postingsPerMonth, avgTjmPerMonth, topSkills, seriesSkills, skillsPerMonth };
}
