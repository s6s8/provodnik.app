import { expect, test } from "@playwright/test";
import { E2E_MUTATIONS_READY, SEED_USERS } from "../fixtures";
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
  // This suite creates real rows against the (live) Supabase the local build targets,
  // so it is gated behind E2E_ALLOW_MUTATIONS=1 (E2E_MUTATIONS_READY) — not just the
  // presence of QA_SEED_PASSWORD — to keep `bun run playwright` non-mutating by default.
  test.skip(!E2E_MUTATIONS_READY, "live-mutation suite — set E2E_ALLOW_MUTATIONS=1 + QA_SEED_PASSWORD to run");
  // Multi-role handshake in one worker; run serially so state carries across steps.
  test.describe.configure({ mode: "serial" });

  test("traveler creates a request", async ({ page }) => {
    await loginAs(page, SEED_USERS.traveler.email, SEED_USERS.traveler.password);

    await page.goto("/");
    const form = page.getByRole("form", { name: "Создать запрос" }).first();
    await expect(form).toBeVisible();

    await form.getByLabel("Направление").fill("Элиста");

    await form.getByRole("button", { name: "Когда" }).click();
    await page
      .locator('[role="dialog"] button:not([disabled])')
      .filter({ hasText: /^\d+$/ })
      .first()
      .click();

    await form.getByRole("button", { name: /темы/i }).click();
    await page.getByRole("option", { name: "История и культура" }).click();

    await form.getByRole("button", { name: /найти гида|отправить запрос/i }).click();

    // Successful create redirects to the newly created request detail.
    await expect(page).toHaveURL(/\/requests\/.+created=1/, { timeout: 15_000 });
  });

  test("guide sees the open request and can open the bid form", async ({ page }) => {
    await loginAs(page, SEED_USERS.guide.email, SEED_USERS.guide.password);

    await page.goto("/guide/inbox");
    // The seeded (approved, base_city=Элиста) guide sees the open Элиста request and
    // can bid on it. The "Подробнее" link carries an aria-label ("Открыть полный
    // запрос: <dest>") that is its accessible name, so target that.
    await expect(
      page.getByRole("button", { name: "Сделать предложение" }).first(),
    ).toBeVisible();
    const firstDetail = page
      .getByRole("link", { name: /Открыть полный запрос/i })
      .first();
    await expect(firstDetail).toBeVisible();
    await firstDetail.click();

    await expect(page).toHaveURL(/\/requests\/.+/);

    // Approved guide can open the bid form: the detail CTA opens the offer dialog
    // whose submit is "Отправить предложение".
    await page
      .getByRole("button", { name: "Сделать предложение" })
      .first()
      .click();
    await expect(
      page.getByRole("dialog", { name: "Отправить предложение" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Отправить предложение" }),
    ).toBeVisible();
  });

  test("traveler sees their open request in the cabinet", async ({ page }) => {
    await loginAs(page, SEED_USERS.traveler.email, SEED_USERS.traveler.password);

    await page.goto("/trips");
    await expect(page.getByRole("heading", { name: "Мои запросы" })).toBeVisible();
    // The just-created request shows in the traveler's active cabinet, awaiting a guide.
    await expect(
      page.getByRole("link", { name: /Ждёт гида/ }).first(),
    ).toBeVisible();
  });
});
