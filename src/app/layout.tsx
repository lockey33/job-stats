import type { Metadata, Viewport } from "next";
import "react-datepicker/dist/react-datepicker.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: 'Job Stats Explorer',
    template: '%s · Job Stats Explorer',
  },
  description: 'Recherche, filtres et tendances (skills, TJM) sur vos offres.',
  applicationName: 'Job Stats Explorer',
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  openGraph: {
    title: 'Job Stats Explorer',
    description: 'Recherche, filtres et tendances (skills, TJM) sur vos offres.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Stats Explorer',
    description: 'Recherche, filtres et tendances (skills, TJM) sur vos offres.',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body className={`antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
