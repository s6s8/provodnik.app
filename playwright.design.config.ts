// Design-regression harness (DESIGN_REFACTOR_PLAN §7.4/§7.5/§7.6).
// Captures every public route at 375/768/1440 into .design-audit/AFTER/, gates
// horizontal overflow at 375, and runs axe on the high-traffic routes.
//
// Separate from playwright.config.ts on purpose: this is a design gate, not the
// product e2e suite, and it must be runnable on its own.
//   bunx playwright test -c playwright.design.config.ts
import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local (CI injects env directly) — not an error
}

export default defineConfig({
  testDir: "./tests/design",
  timeout: 60_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "off",
  },
  ...(process.env.E2E_BASE_URL
    ? {}
    : {
        webServer: {
          command: "bun run dev",
          url: "http://localhost:3000",
          reuseExistingServer: true,
          timeout: 180 * 1000,
        },
      }),
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
