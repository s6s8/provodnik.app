// Playwright end-to-end test runner configuration
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: "bun run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 120 * 1000,
        },
      }),
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
