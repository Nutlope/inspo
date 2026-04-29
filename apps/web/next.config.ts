import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@inspo/taxonomy", "@inspo/shared", "@inspo/db"],
};

export default nextConfig;
