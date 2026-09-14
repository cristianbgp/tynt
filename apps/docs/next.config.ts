import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";
import { resolve } from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tynt/core"],
  outputFileTracingRoot: resolve(import.meta.dirname, "../.."),
  async rewrites() {
    return [
      { source: "/docs/index.md", destination: "/raw/index" },
      { source: "/docs/:path*.md", destination: "/raw/:path*" },
    ];
  },
  async redirects() {
    return [
      { source: "/documents/Getting_Started.html", destination: "/docs/getting-started", permanent: true },
      { source: "/documents/Examples_and_Recipes.html", destination: "/docs/examples", permanent: true },
      { source: "/documents/Cartridge_Files.html", destination: "/docs/cartridge-files", permanent: true },
      { source: "/documents/Publishing.html", destination: "/docs/publishing", permanent: true },
      { source: "/documents/Security.html", destination: "/docs/security", permanent: true },
      { source: "/documents/Cartridge_API.html", destination: "/docs/reference/cartridge-api", permanent: true },
      { source: "/modules/Engine.html", destination: "/docs/reference/cartridge-api", permanent: true },
      { source: "/functions/:path*", destination: "/docs/reference/cartridge-api", permanent: true },
      { source: "/classes/:path*", destination: "/docs/reference/cartridge-api", permanent: true },
      { source: "/interfaces/:path*", destination: "/docs/reference/cartridge-api", permanent: true },
      { source: "/types/:path*", destination: "/docs/reference/cartridge-api", permanent: true },
      { source: "/variables/:path*", destination: "/docs/reference/cartridge-api", permanent: true },
    ];
  },
};

export default createMDX()(nextConfig);
