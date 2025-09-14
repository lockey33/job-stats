import type { JobItem } from '@/features/jobs/types/types';
import type { Row } from '@/shared/utils/export';

export function jobItemToRow(it: JobItem): Row {
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
  } as const;
}

