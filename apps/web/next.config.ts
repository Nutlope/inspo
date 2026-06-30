import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@inspo/taxonomy", "@inspo/shared", "@inspo/db", "@inspo/mcp"],
  // The capture dir is read by /api/placeholder and /api/component in
  // dev. In prod (Vercel) the dir doesn't ship — the routes fall back
  // gracefully. Without this exclusion Next's file-tracer would bundle
  // 25K PNGs (~3GB) into the deployment.
  outputFileTracingExcludes: {
    "/api/placeholder/**": ["../worker/captures/**"],
    "/api/component/**": ["../worker/captures/**"],
    // These two also read the dev-only captures dir; without the
    // exclusion Next traces the whole ~30K-file / 35GB directory into the
    // lambda and blows the function-size limit when captures are present.
    "/api/captures/**": ["../worker/captures/**"],
    "/screens/[slug]/history/**": ["../worker/captures/**"],
  },
  images: {
    // The gallery still ships raw <img> + <picture> for now — Vercel's
    // image optimizer is bypassed because we pre-encode AVIF/WebP on
    // the capture worker (cheaper at scale, no per-request cold encode).
    // These settings stay populated so a future move to <Image> for
    // the detail pages won't be blocked, and so any direct hits on
    // /_next/image with our blob host don't 400.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/captures/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    // Next 16 requires explicit qualities. Match what the worker
    // emits (AVIF 55/60/70, WebP 68/72/80) plus a 75 default.
    qualities: [55, 60, 68, 70, 72, 75, 80],
    minimumCacheTTL: 60 * 60 * 24 * 31, // 31 days — matches blob max-age
    deviceSizes: [384, 640, 768, 1024, 1280, 1920],
  },
};

export default nextConfig;
