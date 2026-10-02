import type { NextConfig } from "next";
import { legacyNavRedirects } from "./src/lib/nav-migration";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async redirects() {
    return legacyNavRedirects();
  },
};

export default nextConfig;
