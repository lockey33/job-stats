import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const host = process.env.NEXT_PUBLIC_SITE_URL || ''

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: host ? `${host.replace(/\/$/, '')}/sitemap.xml` : undefined,
  }
}
