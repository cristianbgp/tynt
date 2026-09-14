import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1280, height: 800 },
  },
  webServer: [
    {
      command: "bun run dev -- --host 127.0.0.1",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: true,
    },
    {
      command: "bun run --cwd ../docs dev",
      url: "http://127.0.0.1:4174",
      reuseExistingServer: true,
    },
  ],
});
