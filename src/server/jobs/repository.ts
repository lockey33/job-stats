import 'server-only'
import { readFile, stat, readdir, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { JobItem } from '@/features/jobs/types/types'
import { JobItemSchema } from '@/features/jobs/utils/schemas'

type DatasetCache = { jobs: JobItem[]; path: string; version: string } | null
let cache: DatasetCache = null

const CANDIDATES = [
  path.join(process.cwd(), 'var', 'data', 'merged.json'),
  path.join(process.cwd(), 'public', 'merged.json'),
  path.join(process.cwd(), 'public', 'data', 'merged.json'),
  path.join(process.cwd(), 'data', 'merge', 'merged.json'),
]

async function findMergedJsonPath(): Promise<string> {
  let lastErr: unknown = null
  for (const filePath of CANDIDATES) {
    try {
      // If we can stat the file, consider it found
      await stat(filePath)
      return filePath
    } catch (e) {
      lastErr = e
    }
  }
  const lastMsg = lastErr instanceof Error ? lastErr.message : String(lastErr)
  throw new Error(
    `merged.json not found in any known location. Tried: \n${CANDIDATES.join('\n')}.\nLast error: ${lastMsg}`,
  )
}

async function computeFileVersion(filePath: string): Promise<string> {
  const s = await stat(filePath)
  // Use size + mtimeMs as a fast-changing version identifier
  return `${s.size}-${Math.floor(s.mtimeMs)}`
}

async function readMergedJson(filePath: string): Promise<JobItem[]> {
  const raw = await readFile(filePath, 'utf-8')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Lenient fallback: replace ASCII control chars (U+0000..U+001F)
    const sanitized = raw.replace(/[\u0000-\u001F]/g, ' ')
    parsed = JSON.parse(sanitized)
  }
  let arr: unknown[] | null = null
  if (Array.isArray(parsed)) {
    arr = parsed as unknown[]
  } else if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as { data?: unknown }).data)
  ) {
    arr = (parsed as { data: unknown[] }).data
  }
  if (!arr) throw new Error(`Unsupported merged.json format at ${filePath}`)
  const validated: JobItem[] = []
  for (const it of arr) {
    const res = JobItemSchema.safeParse(it)
    if (res.success) validated.push(res.data)
  }
  return validated
}

export async function getDatasetVersion(): Promise<string> {
  try {
    const filePath = await findMergedJsonPath()
    return computeFileVersion(filePath)
  } catch {
    // Fallback to chunks version if merged.json not found
    const { version } = await readMergedFromChunks()
    return version
  }
}

export async function getAllJobs(): Promise<JobItem[]> {
  try {
    const filePath = await findMergedJsonPath()
    const version = await computeFileVersion(filePath)
    if (cache && cache.path === filePath && cache.version === version) {
      return cache.jobs
    }
    const jobs = await readMergedJson(filePath)
    cache = { jobs, path: filePath, version }
    return jobs
  } catch (e) {
    // Fallback: build from src/data numeric chunks when merged.json is absent
    try {
      const built = await readMergedFromChunks()
      cache = { jobs: built.jobs, path: 'chunks', version: built.version }
      return built.jobs
    } catch (e2) {
      cache = null
      throw e
    }
  }
}

export function clearCache() {
  cache = null
}

async function readMergedFromChunks(): Promise<{ jobs: JobItem[]; version: string }> {
  const dataDir = path.join(process.cwd(), 'src', 'data')
  const names = await readdir(dataDir).catch(() => [] as string[])
  const files = names
    .filter((n) => /^\d+\.json$/.test(n))
    .map((n) => ({ n: Number(n.replace(/\.json$/, '')), name: n, full: path.join(dataDir, n) }))
    .sort((a, b) => a.n - b.n)
  if (files.length === 0)
    throw new Error('No numeric data files found in src/data for fallback build')

  const seen = new Set<number>()
  const out: JobItem[] = []
  let totalSize = 0
  let maxMtime = 0
  for (const f of files) {
    const s = await stat(f.full).catch(() => null)
    if (s) {
      totalSize += s.size
      if (s.mtimeMs > maxMtime) maxMtime = s.mtimeMs
    }
    const raw = await readFile(f.full, 'utf-8')
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      const sanitized = raw.replace(/[\u0000-\u001F]/g, ' ')
      try {
        parsed = JSON.parse(sanitized)
      } catch {
        parsed = {}
      }
    }
    let arr: unknown[] = []
    if (Array.isArray(parsed)) {
      arr = parsed as unknown[]
    } else if (
      parsed &&
      typeof parsed === 'object' &&
      'data' in parsed &&
      Array.isArray(parsed.data)
    ) {
      arr = parsed.data
    }
    for (const it of arr) {
      const res = JobItemSchema.safeParse(it)
      if (!res.success) continue
      const id = res.data.id
      if (seen.has(id)) continue
      seen.add(id)
      out.push(res.data)
    }
  }
  // version derived from chunks stats
  const version = `chunks-${totalSize}-${Math.floor(maxMtime)}`
  // Persist a merged.json snapshot to speed up subsequent requests in the same runtime
  try {
    const target = path.join(process.cwd(), 'var', 'data', 'merged.json')
    await mkdir(path.dirname(target), { recursive: true })
    // Write in { data: [...] } shape to be consistent with update-data script
    const json = JSON.stringify({ data: out })
    await writeFile(target, json, 'utf-8')
  } catch {
    // best-effort: ignore write errors
  }
  return { jobs: out, version }
}
