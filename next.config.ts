import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // We ignore lint errors during builds to avoid blocking deployments
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
