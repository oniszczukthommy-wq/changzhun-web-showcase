import type { NextConfig } from "next";

// Built as static files that the Tauri app bundles (frontendDist in src-tauri/tauri.conf.json), so no Node at runtime.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
