import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during production builds (we run it separately)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors (we already checked types locally)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
