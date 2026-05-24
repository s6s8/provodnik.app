import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/walkthrough",
  timeout: 60000,
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    baseURL: "https://provodnik.app",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});