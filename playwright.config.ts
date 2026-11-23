import { defineConfig, devices } from "@playwright/test";

const url = "http://127.0.0.1:3179";
const channel = process.env.PLAYWRIGHT_CHANNEL || undefined;

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || "test-results",
  // The clipboard tests share the operating system clipboard.
  workers: 1,
  reporter: "list",
  globalSetup: "./tests/browser/start-server.ts",
  use: { baseURL: url, channel, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
