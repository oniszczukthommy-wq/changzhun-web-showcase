import type { NextConfig } from "next";

// A fully static site: `npm run build` writes plain HTML/CSS/JS to out/, which any static host can serve.
// For a GitHub Pages project site (served under /<repo>/), build with BASE_PATH=/<repo>.
const basePath = process.env.BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
