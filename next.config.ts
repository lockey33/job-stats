import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Lint errors do not block builds while migrating to no-semicolons
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
