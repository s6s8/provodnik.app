// Playwright end-to-end test runner configuration
import { defineConfig, devices } from "@playwright/test";

// Load .env.local so QA_SEED_PASSWORD (and other test env) reaches the specs.
// Playwright does not read Next's env files; without this the seeded-login suites
// silently skip. Native loader (Node 20.12+), no dependency. Optional in CI.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local absent (e.g. CI injects env directly) — not an error.
}

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  // Remote dev target compiles routes on demand — first hits can take >30s.
  timeout: process.env.E2E_BASE_URL ? 90_000 : 30_000,
  retries: process.env.E2E_BASE_URL ? 1 : 0,
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
    // Role-fixture setup: logs in each role and writes storageState (see auth.setup.ts).
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
    },
  ],
});
