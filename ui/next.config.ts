import type { NextConfig } from "next";

// Built as static files that the Tauri app bundles (frontendDist in src-tauri/tauri.conf.json), so no Node at runtime.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  webpack(config) {
    // Use Node's native hash rather than the bundled WebAssembly hasher.
    // The latter fails in this Mac's Node 24.22 build runtime.
    config.output.hashFunction = "sha256";
    return config;
  },
};

export default nextConfig;
