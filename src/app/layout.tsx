import 'react-datepicker/dist/react-datepicker.css'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata, Viewport } from 'next'

import { env } from '@/env'

import Providers from './providers'

export const metadata: Metadata = {
  title: {
    default: 'Job Stats Explorer',
    template: '%s · Job Stats Explorer',
  },
  description: 'Recherche, filtres et tendances (compétences, TJM) sur vos offres.',
  applicationName: 'Job Stats Explorer',
  metadataBase: env.NEXT_PUBLIC_SITE_URL ? new URL(env.NEXT_PUBLIC_SITE_URL) : undefined,
  openGraph: {
    title: 'Job Stats Explorer',
    description: 'Recherche, filtres et tendances (compétences, TJM) sur vos offres.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Stats Explorer',
    description: 'Recherche, filtres et tendances (compétences, TJM) sur vos offres.',
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`light ${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body className={`antialiased`} style={{ background: '#f8fafc' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
