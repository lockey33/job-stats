import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Enforce ESLint during builds for code quality
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Reduce client bundle size by converting deep imports to direct entrypoints
    optimizePackageImports: [
      '@chakra-ui/react',
      '@chakra-ui/icons',
      '@tanstack/react-query',
      'date-fns',
      'recharts',
    ],
  },
  // Ensure compression is enabled when self-hosting via `next start`
  compress: true,
}

export default nextConfig
