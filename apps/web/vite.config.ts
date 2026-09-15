import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/browser/**", "node_modules/**"],
  },
});
