export type RemoteMode = 'full' | 'partial' | 'none' | string
export type ExperienceLevel = 'junior' | 'intermediate' | 'senior' | string

export interface Duration {
  months?: number
  years?: number
}

export interface JobItem {
  id: number
  created_at: string // ISO datetime
  job?: string | null
  job_slug?: string | null
  slug?: string | null
  title?: string | null
  skills?: string[]
  soft_skills?: string[]
  company_name?: string | null
  city?: string | null
  long?: number | null
  lat?: number | null
  duration?: Duration | null
  remote?: RemoteMode | null
  max_tjm?: number | null
  min_tjm?: number | null
  experience?: ExperienceLevel | null
  description?: string | null
  candidate_profile?: string | null
  company_description?: string | null
}

export interface JobFilters {
  q?: string // free-text search
  skills?: string[] // contains any
  excludeSkills?: string[] // exclude any
  excludeTitle?: string[] // when title contains any of these keywords
  cities?: string[]
  cityMatch?: 'contains' | 'exact'
  excludeCities?: boolean
  regions?: string[]
  excludeRegions?: boolean
  remote?: RemoteMode[]
  experience?: ExperienceLevel[]
  job_slugs?: string[]
  minTjm?: number
  maxTjm?: number
  startDate?: string
  endDate?: string
}

export interface Pagination {
  page: number
  pageSize: number
}

export interface JobsResult {
  items: JobItem[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

export interface MetaFacets {
  skills: string[]
  cities: string[]
  regions: string[]
  job_slugs: string[]
  experience: string[]
  remote: string[]
  tjm: { min: number | null; max: number | null }
  created_at: { min: string | null; max: string | null }
}

export interface MonthlyPoint {
  month: string // yyyy-mm
  value: number
}

export interface SkillsSeriesPoint {
  month: string // yyyy-mm
  [skill: string]: number | string
}

export interface AnalyticsResult {
  months: string[]
  postingsPerMonth: MonthlyPoint[]
  avgTjmPerMonth: MonthlyPoint[]
  topSkills: string[]
  seriesSkills: string[]
  skillsPerMonth: SkillsSeriesPoint[]
}

export interface TopSkill {
  skill: string
  count: number
}

export interface EmergingSkillMonthlyRank {
  month: string
  rank: number
}

export interface EmergingSkillTrend {
  skill: string
  monthly: EmergingSkillMonthlyRank[]
  slope: number
}

export interface EmergingSkillTrendPayload {
  months: string[]
  trends: EmergingSkillTrend[]
}
