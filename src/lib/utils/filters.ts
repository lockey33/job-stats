import { z } from 'zod';
import { JobFilters } from '@/lib/domain/types';

export const filtersSchema = z.object({
  q: z.string().optional(),
  skills: z.array(z.string()).optional(),
  excludeSkills: z.array(z.string()).optional(),
  excludeTitle: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  cityMatch: z.enum(['contains', 'exact']).default('contains').optional(),
  excludeCities: z.coerce.boolean().default(false).optional(),
  regions: z.array(z.string()).optional(),
  excludeRegions: z.coerce.boolean().default(false).optional(),
  remote: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
  job_slugs: z.array(z.string()).optional(),
  minTjm: z.coerce.number().optional(),
  maxTjm: z.coerce.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(20),
});

export type ParsedFilters = z.infer<typeof filtersSchema>;

export function parseFiltersFromSearchParams(params: URLSearchParams): JobFilters & { page: number; pageSize: number } {
  const getArray = (key: string) => params.getAll(key).flatMap((v) => v.split(',').map((s) => s.trim()).filter(Boolean));

  const input = {
    q: params.get('q') ?? undefined,
    skills: getArray('skills'),
    excludeSkills: getArray('excludeSkills'),
    excludeTitle: getArray('excludeTitle'),
    cities: getArray('cities'),
    cityMatch: (params.get('cityMatch') as 'contains' | 'exact' | null) ?? undefined,
    excludeCities: params.get('excludeCities') ?? undefined,
    regions: getArray('regions'),
    excludeRegions: params.get('excludeRegions') ?? undefined,
    remote: getArray('remote'),
    experience: getArray('experience'),
    job_slugs: getArray('job_slugs'),
    minTjm: params.get('minTjm') ?? undefined,
    maxTjm: params.get('maxTjm') ?? undefined,
    startDate: params.get('startDate') ?? undefined,
    endDate: params.get('endDate') ?? undefined,
    page: params.get('page') ?? undefined,
    pageSize: params.get('pageSize') ?? undefined,
  };

  const parsed = filtersSchema.parse(input);
  const { page, pageSize, ...rest } = parsed;
  return { ...rest, page, pageSize };
}

export function toQueryString(filters: Partial<JobFilters & { page: number; pageSize: number }>): string {
  const params = new URLSearchParams();
  const addArray = (key: string, arr?: string[]) => {
    if (!arr || arr.length === 0) return;
    params.set(key, arr.join(','));
  };

  if (filters.q) params.set('q', filters.q);
  addArray('skills', filters.skills as string[] | undefined);
  addArray('excludeSkills', filters.excludeSkills as string[] | undefined);
  addArray('excludeTitle', filters.excludeTitle as string[] | undefined);
  addArray('cities', filters.cities as string[] | undefined);
  if (filters.cityMatch) params.set('cityMatch', filters.cityMatch);
  if (typeof (filters as any).excludeCities !== 'undefined') params.set('excludeCities', String((filters as any).excludeCities));
  addArray('regions', filters.regions as string[] | undefined);
  if (typeof (filters as any).excludeRegions !== 'undefined') params.set('excludeRegions', String((filters as any).excludeRegions));
  addArray('remote', filters.remote as string[] | undefined);
  addArray('experience', filters.experience as string[] | undefined);
  addArray('job_slugs', filters.job_slugs as string[] | undefined);
  if (typeof filters.minTjm === 'number') params.set('minTjm', String(filters.minTjm));
  if (typeof filters.maxTjm === 'number') params.set('maxTjm', String(filters.maxTjm));
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

  return params.toString();
}
