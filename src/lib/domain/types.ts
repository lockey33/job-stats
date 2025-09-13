export type RemoteMode = 'full' | 'partial' | 'none' | string;
export type ExperienceLevel = 'junior' | 'intermediate' | 'senior' | string;

export interface Duration {
  months?: number;
  years?: number;
}

export interface JobItem {
  id: number;
  created_at: string; // ISO datetime
  job?: string | null;
  job_slug?: string | null;
  slug?: string | null;
  title?: string | null;
  skills?: string[];
  soft_skills?: string[];
  company_name?: string | null;
  city?: string | null;
  long?: number | null;
  lat?: number | null;
  duration?: Duration | null;
  remote?: RemoteMode | null;
  max_tjm?: number | null;
  min_tjm?: number | null;
  experience?: ExperienceLevel | null;
  description?: string | null;
  candidate_profile?: string | null;
  company_description?: string | null;
}

export interface JobFilters {
  q?: string; // free-text search
  skills?: string[]; // contains any
  excludeSkills?: string[]; // exclude any
  excludeTitle?: string[]; // exclude if title contains any of these keywords (case-insensitive)
  cities?: string[]; // exact match (case-insensitive)
  cityMatch?: 'contains' | 'exact';
  excludeCities?: boolean; // when true, exclude items matching selected cities
  regions?: string[]; // region names
  excludeRegions?: boolean; // when true, exclude items matching selected regions
  remote?: RemoteMode[];
  experience?: ExperienceLevel[];
  job_slugs?: string[];
  minTjm?: number;
  maxTjm?: number;
  startDate?: string; // ISO date (yyyy-mm-dd)
  endDate?: string; // ISO date
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface JobsResult {
  items: JobItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface MetaFacets {
  skills: string[];
  cities: string[];
  regions: string[];
  job_slugs: string[];
  experience: string[];
  remote: string[];
  tjm: { min: number | null; max: number | null };
  created_at: { min: string | null; max: string | null };
}

export interface MonthlyPoint {
  month: string; // yyyy-mm
  value: number;
}

export interface SkillsSeriesPoint {
  month: string; // yyyy-mm
  [skill: string]: number | string;
}

export interface AnalyticsResult {
  months: string[]; // sorted yyyy-mm
  postingsPerMonth: MonthlyPoint[];
  avgTjmPerMonth: MonthlyPoint[];
  topSkills: string[];
  seriesSkills: string[]; // actual series included in skillsPerMonth
  skillsPerMonth: SkillsSeriesPoint[]; // each point has counts per series skill
}
