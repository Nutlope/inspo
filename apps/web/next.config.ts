import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@inspo/taxonomy", "@inspo/shared", "@inspo/db"],
  // The capture dir is read by /api/placeholder and /api/component in
  // dev. In prod (Vercel) the dir doesn't ship — the routes fall back
  // gracefully. Without this exclusion Next's file-tracer would bundle
  // 25K PNGs (~3GB) into the deployment.
  outputFileTracingExcludes: {
    "/api/placeholder/**": ["../worker/captures/**"],
    "/api/component/**": ["../worker/captures/**"],
  },
};

export default nextConfig;
