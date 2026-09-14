import { fumadocsMdx } from "fumadocs-mdx/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: fumadocsMdx(),
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
});
