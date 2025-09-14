export class ApiError extends Error {
  status: number;
  url: string;
  body?: unknown;
  constructor(url: string, status: number, message?: string, body?: unknown) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function apiGet<T>(path: string, query?: Query, init?: RequestInit): Promise<T> {
  const url = buildUrl(path, query);
  const res = await fetch(url, { method: 'GET', ...init });
  const ctype = res.headers.get('content-type') || '';
  if (!res.ok) {
    let body: unknown = undefined;
    try { body = ctype.includes('application/json') ? await res.json() : await res.text(); } catch {}
    throw new ApiError(url, res.status, `GET ${url} failed: ${res.status}`, body);
  }
  if (ctype.includes('application/json')) return res.json() as Promise<T>;
  return (await res.text()) as unknown as T;
}

export function buildQueryFromFilters(
  filters: Record<string, unknown> = {},
  extra: Record<string, string | number | boolean | undefined> = {}
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v == null) continue;
    if (Array.isArray(v)) query[k] = v.join(',');
    else query[k] = String(v as string | number | boolean);
  }
  for (const [k, v] of Object.entries(extra)) {
    if (typeof v === 'undefined' || v === null) continue;
    query[k] = String(v as string | number | boolean);
  }
  return query;
}

