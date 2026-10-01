import type { NextConfig } from "next";
import { legacyNavRedirects } from "./src/lib/nav-migration";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return legacyNavRedirects();
  },
};

export default nextConfig;
