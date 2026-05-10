import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin workspace root to this directory so Next stops inferring the
  // user's pnpm-lock.yaml at the home directory.
  turbopack: {
    root: path.resolve("."),
  },
};

export default nextConfig;
