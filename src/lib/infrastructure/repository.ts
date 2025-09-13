import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { JobItem } from '@/lib/domain/types';

let cache: { jobs: JobItem[] } | null = null;

export const runtime = 'nodejs';

async function readMergedJsonFromDisk(): Promise<JobItem[]> {
  const candidates = [
    path.join(process.cwd(), 'public', 'merged.json'),
    path.join(process.cwd(), 'public', 'data', 'merged.json'),
    path.join(process.cwd(), 'data', 'merge', 'merged.json'),
  ];

  let lastErr: unknown = null;
  for (const filePath of candidates) {
    try {
      const raw = await readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as JobItem[];
      }
      if (parsed && Array.isArray((parsed as any).data)) {
        return (parsed as any).data as JobItem[];
      }
      throw new Error(`Unsupported merged.json format at ${filePath}`);
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  throw new Error(
    `merged.json not found in any known location. Tried: \n${candidates.join('\n')}.\nLast error: ${(lastErr as any)?.message ?? String(lastErr)}`
  );
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
