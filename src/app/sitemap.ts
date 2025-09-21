import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
  const now = new Date().toISOString()

  // Canonicalize to /jobs (home redirects there)
  return [{ url: `${base}/jobs`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 }]
}
