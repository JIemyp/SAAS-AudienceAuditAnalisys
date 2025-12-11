import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors (we already checked types locally)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
