import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@pairly/ui",
    "@pairly/database",
    "@pairly/types",
    "@pairly/utils",
    "@pairly/validation",
    "@pairly/config",
  ],
};

export default nextConfig;
