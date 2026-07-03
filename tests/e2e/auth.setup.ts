import { test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { E2E_READY, SEED_USERS } from "./fixtures";
import { loginAs } from "./helpers";

// Role-fixture setup project (Playwright storageState pattern). Authenticates each
// role once and writes a reusable session to playwright/.auth/<role>.json so the
// authenticated specs don't re-login per test.
//
// Live auth needs seeded QA accounts (`bun scripts/seed-test-users.mjs <env>` with
// QA_SEED_PASSWORD). When those credentials are absent (E2E_READY === false) we still
// write a valid empty storage state so storageState-bound projects load, and the
// authenticated specs skip themselves. This keeps the suite honest — it never passes
// by pretending to be logged in.
const AUTH_DIR = "playwright/.auth";
const EMPTY_STATE = JSON.stringify({ cookies: [], origins: [] });

for (const role of ["traveler", "guide", "admin"] as const) {
  setup(`authenticate ${role}`, async ({ page }) => {
    mkdirSync(AUTH_DIR, { recursive: true });
    const file = `${AUTH_DIR}/${role}.json`;

    if (!E2E_READY) {
      writeFileSync(file, EMPTY_STATE);
      setup.skip(true, "QA_SEED_PASSWORD not set — seeded auth unavailable");
      return;
    }

    await loginAs(page, SEED_USERS[role].email, SEED_USERS[role].password);
    await page.context().storageState({ path: file });
  });
}
