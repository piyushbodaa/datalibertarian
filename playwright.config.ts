import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests", workers: 2, use: { baseURL: "http://127.0.0.1:4173" },
  webServer: { command: "node scripts/serve.mjs", url: "http://127.0.0.1:4173", reuseExistingServer: !process.env.CI },
});
