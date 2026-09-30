import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow production verification without overwriting a running dev server's cache.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
};

export default nextConfig;
