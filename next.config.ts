import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Enforce ESLint during builds for code quality
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
