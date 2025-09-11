import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { JobItem } from '@/lib/domain/types';

let cache: { jobs: JobItem[] } | null = null;

export const runtime = 'nodejs';

async function readMergedJsonFromDisk(): Promise<JobItem[]> {
  const filePath = path.join(process.cwd(), 'public', 'data', 'merged.json');
  const raw = await readFile(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return parsed as JobItem[];
  }
  if (parsed && Array.isArray(parsed.data)) {
    return parsed.data as JobItem[];
  }
  throw new Error('Unsupported merged.json format');
}

export async function getAllJobs(): Promise<JobItem[]> {
  if (cache) return cache.jobs;
  const jobs = await readMergedJsonFromDisk();
  cache = { jobs };
  return jobs;
}

export function clearCache() {
  cache = null;
}
