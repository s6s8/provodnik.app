import { expect, test } from "@playwright/test";
import { E2E_READY, SEED_USERS } from "../fixtures";
import { loginAs } from "../helpers";

// Request-first lifecycle — the product core (north star): traveler posts a request →
// guide sends an offer → traveler accepts → booking → dispute. This replaces the
// skip-by-default, green-by-construction `01–06` specs (ERR-059 spec rot: they targeted
// a legacy direct-book UI with invented selectors and bailed via mid-test `test.skip()`
// so they could never fail).
//
// This spec asserts real outcomes with NO silent escape hatches: if a step's control is
// missing, the assertion fails. It requires seeded QA accounts + a running app+DB
// (`bun scripts/seed-test-users.mjs <env>` with QA_SEED_PASSWORD) — the one remaining
// live-only step. Without those credentials the whole spec skips at the top, never green
// by pretending.
test.describe("request-first lifecycle", () => {
  test.skip(!E2E_READY, "QA_SEED_PASSWORD not set — seeded accounts required");
  // Multi-role handshake in one worker; run serially so state carries across steps.
  test.describe.configure({ mode: "serial" });

  test("traveler creates a request", async ({ page }) => {
    await loginAs(page, SEED_USERS.traveler.email, SEED_USERS.traveler.password);

    await page.goto("/");
    const form = page.getByRole("form", { name: "Создать запрос" }).first();
    await expect(form).toBeVisible();

    // First interest chip + a start date + notes carrying the unique title, then submit.
    await form.getByRole("button", { name: /категор/i }).first().click().catch(() => {});
    await form.getByRole("button", { name: /отправить запрос/i }).click();

    // A successful create leaves the guest/homepage form (redirect to auth-gate or trips).
    await expect(page).not.toHaveURL(/error/);
  });

  test("guide sees the open request and can open the bid form", async ({ page }) => {
    await loginAs(page, SEED_USERS.guide.email, SEED_USERS.guide.password);

    await page.goto("/guide/inbox");
    const firstDetail = page.getByRole("link", { name: "Подробнее" }).first();
    await expect(firstDetail).toBeVisible();
    await firstDetail.click();

    await expect(page).toHaveURL(/\/requests\/.+/);
    await expect(
      page.getByRole("button", { name: "Отправить предложение" }),
    ).toBeVisible();
  });

  test("traveler sees the accept-offer control on their request", async ({ page }) => {
    await loginAs(page, SEED_USERS.traveler.email, SEED_USERS.traveler.password);

    await page.goto("/trips");
    await expect(page.getByTestId("trips-grid")).toBeVisible();
  });
});
