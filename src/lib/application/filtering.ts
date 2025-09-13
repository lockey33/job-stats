import { differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import { cityToRegion } from '@/lib/domain/regions';
import { JobFilters, JobItem, JobsResult, MetaFacets, Pagination } from '@/lib/domain/types';

function norm(s?: string | null): string {
  return (s ?? '').toString().toLowerCase();
}

function normCity(s?: string | null): string {
  // Lowercase, remove parenthetical segments like " (33)", collapse spaces
  let v = norm(s);
  v = v.replace(/\([^)]*\)/g, " ");
  v = v.replace(/\s+/g, " ").trim();
  return v;
}

function stripHtml(input?: string | null): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, ' ');
}

function itemText(item: JobItem): string {
  return [
    item.title,
    item.company_name,
    item.city,
    (item.skills ?? []).join(' '),
    stripHtml(item.description),
    stripHtml(item.candidate_profile),
    stripHtml(item.company_description),
  ]
    .map(norm)
    .join(' ');
}

function itemTjmApprox(item: JobItem): number | null {
  const { min_tjm, max_tjm } = item;
  if (typeof min_tjm === 'number' && typeof max_tjm === 'number') {
    return (min_tjm + max_tjm) / 2;
  }
  if (typeof min_tjm === 'number') return min_tjm;
  if (typeof max_tjm === 'number') return max_tjm;
  return null;
}

function dateInRange(item: JobItem, start?: string, end?: string): boolean {
  if (!item.created_at) return false;
  let d: Date;
  try {
    d = parseISO(item.created_at);
  } catch {
    return false;
  }
  if (start) {
    const sd = parseISO(start);
    if (isBefore(d, sd)) return false;
  }
  if (end) {
    const ed = parseISO(end);
    if (isAfter(d, ed)) return false;
  }
  return true;
}

export function applyFilters(jobs: JobItem[], filters: JobFilters): JobItem[] {
  const q = norm(filters.q);
  const skills = (filters.skills ?? []).map((s) => norm(s));
  const excludeSkills = (filters.excludeSkills ?? []).map((s) => norm(s));
  const excludeTitle = (filters.excludeTitle ?? []).map((s) => norm(s));
  const cities = (filters.cities ?? []).map((s) => normCity(s));
  const regions = (filters.regions ?? []).map((s) => norm(s));
  const remote = (filters.remote ?? []).map((s) => norm(s));
  const experience = (filters.experience ?? []).map((s) => norm(s));
  const job_slugs = (filters.job_slugs ?? []).map((s) => norm(s));

  return jobs.filter((j) => {
    // text search
    if (q && !itemText(j).includes(q)) return false;

    // skills (AND match: must include all selected skills)
    if (skills.length > 0) {
      const jsSet = new Set((j.skills ?? []).map(norm));
      if (!skills.every((s) => jsSet.has(s))) return false;
    }

    // exclude skills (any match)
    if (excludeSkills.length > 0) {
      const js = (j.skills ?? []).map(norm);
      if (excludeSkills.some((s) => js.includes(s))) return false;
    }

    // exclude title keywords (any substring match)
    if (excludeTitle.length > 0) {
      const t = norm(j.title);
      if (excludeTitle.some((w) => w && t.includes(w))) return false;
    }

    // cities (exact or contains, tolerant to parentheses)
    if (cities.length > 0) {
      const c = normCity(j.city);
      const mode = filters.cityMatch ?? 'contains';
      const match = mode === 'exact'
        ? cities.includes(c)
        : cities.some((needle) => needle && c.includes(needle));
      const exclude = !!filters.excludeCities;
      if (!exclude) {
        // inclusive mode: require a match
        if (!match) return false;
      } else {
        // exclusive mode: require no match
        if (match) return false;
      }
    }

    // regions (resolved from department code in the city when available)
    if (regions.length > 0) {
      const reg = cityToRegion(j.city);
      const rn = norm(reg);
      const has = rn ? regions.includes(rn) : false;
      const exclude = !!filters.excludeRegions;
      if (!exclude) {
        if (!has) return false;
      } else {
        if (has) return false;
      }
    }

    // remote
    if (remote.length > 0) {
      const r = norm(j.remote ?? '');
      if (!remote.includes(r)) return false;
    }

    // experience
    if (experience.length > 0) {
      const e = norm(j.experience ?? '');
      if (!experience.includes(e)) return false;
    }

    // job_slugs
    if (job_slugs.length > 0) {
      const s = norm(j.job_slug ?? '');
      if (!job_slugs.includes(s)) return false;
    }

    // TJM
    const tjm = itemTjmApprox(j);
    if (typeof filters.minTjm === 'number' && (tjm == null || tjm < filters.minTjm)) return false;
    if (typeof filters.maxTjm === 'number' && (tjm == null || tjm > filters.maxTjm)) return false;

    // date range
    if (filters.startDate || filters.endDate) {
      if (!dateInRange(j, filters.startDate, filters.endDate)) return false;
    }

    return true;
  });
}

export function dedupeById(items: JobItem[]): JobItem[] {
  const out: JobItem[] = [];
  const seen = new Set<number>();
  for (const it of items) {
    if (typeof it.id !== 'number') {
      out.push(it);
      continue;
    }
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

export function paginate(items: JobItem[], { page, pageSize }: Pagination): JobsResult {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return { items: slice, total, page, pageSize, pageCount };
}

export function computeFacets(jobs: JobItem[]): MetaFacets {
  // Compute facets on unique postings to avoid skew from duplicates
  jobs = dedupeById(jobs);
  const skillsSet = new Set<string>();
  const citiesSet = new Set<string>();
  const regionsSet = new Set<string>();
  const jobSlugSet = new Set<string>();
  const expSet = new Set<string>();
  const remoteSet = new Set<string>();

  let minT: number | null = null;
  let maxT: number | null = null;
  let minDate: string | null = null;
  let maxDate: string | null = null;

  for (const j of jobs) {
    (j.skills ?? []).forEach((s) => s && skillsSet.add(s));
    if (j.city) citiesSet.add(j.city);
    const reg = cityToRegion(j.city);
    if (reg) regionsSet.add(reg);
    if (j.job_slug) jobSlugSet.add(j.job_slug);
    if (j.experience) expSet.add(j.experience);
    if (j.remote) remoteSet.add(String(j.remote));

    const tjm = itemTjmApprox(j);
    if (tjm != null) {
      minT = minT == null ? tjm : Math.min(minT, tjm);
      maxT = maxT == null ? tjm : Math.max(maxT, tjm);
    }

    if (j.created_at) {
      const ymd = j.created_at.slice(0, 10);
      if (!minDate || ymd < minDate) minDate = ymd;
      if (!maxDate || ymd > maxDate) maxDate = ymd;
    }
  }

  return {
    skills: Array.from(skillsSet).sort((a, b) => a.localeCompare(b)),
    cities: Array.from(citiesSet).sort((a, b) => a.localeCompare(b)),
    regions: Array.from(regionsSet).sort((a, b) => a.localeCompare(b)),
    job_slugs: Array.from(jobSlugSet).sort((a, b) => a.localeCompare(b)),
    experience: Array.from(expSet).sort((a, b) => a.localeCompare(b)),
    remote: Array.from(remoteSet).sort((a, b) => a.localeCompare(b)),
    tjm: { min: minT, max: maxT },
    created_at: { min: minDate, max: maxDate },
  };
}
