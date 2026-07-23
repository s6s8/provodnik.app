import { expect, test } from "@playwright/test";

/**
 * Bounded first-interaction latency check for the homepage.
 *
 * Live oracle: Playwright click on the header «Гиды» link ~400ms after navigation
 * commit (during the hydration long-task window), measuring wall-clock time until
 * /guides navigation.
 *
 * Baseline before fix (dev, warm cache, 2026-07-23): ~551ms click→route at 400ms delay.
 * After fix (production build, same path): ~131ms average.
 * Dev-mode timing stays noisy because /guides compiles on demand; set E2E_BASE_URL
 * to a production server for the strict budget.
 */
const isProductionOracle = Boolean(process.env.E2E_BASE_URL);
const NAV_CLICK_BUDGET_MS = isProductionOracle ? 450 : 2_000;
const CLICK_DELAY_MS = 400;

async function warmupHomepage(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "networkidle" });
}

async function measureHeaderNavLatency(page: import("@playwright/test").Page) {
  await page.goto("/", { waitUntil: "commit" });
  await page.waitForTimeout(CLICK_DELAY_MS);

  const nav = page.locator('header a[href="/guides"]').first();
  await expect(nav).toBeVisible();

  const startedAt = Date.now();
  await Promise.all([page.waitForURL(/\/guides/, { timeout: 10_000 }), nav.click()]);
  return Date.now() - startedAt;
}

test.describe("homepage first-interaction latency", () => {
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await warmupHomepage(page);
    await page.close();
  });

  test("header nav responds within budget during hydration", async ({ page }) => {
    const navClickToRouteMs = await measureHeaderNavLatency(page);

    expect(
      navClickToRouteMs,
      `nav click→route ${navClickToRouteMs}ms at ${CLICK_DELAY_MS}ms after commit`,
    ).toBeLessThan(NAV_CLICK_BUDGET_MS);
  });

  test("deferred hero form exposes an accessible loading state", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const loading = page.getByRole("status", { name: "Загрузка формы запроса" });
    const form = page.getByRole("form", { name: "Создать запрос" });

    await expect(loading.or(form)).toBeVisible({ timeout: 10_000 });
    await expect(form).toBeVisible({ timeout: 10_000 });
  });
});

// Needs disposable seeded open requests on / so «Сборные группы» cards render.
// No linked Supabase seed in this worktree — do not claim card latency is measured.
test.describe.skip("homepage open group card latency", () => {
  test("card click navigates within budget during hydration", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    await page.waitForTimeout(CLICK_DELAY_MS);

    const card = page.getByRole("link", { name: /Присоединиться/i }).first();
    await expect(card).toBeVisible();

    const startedAt = Date.now();
    await Promise.all([
      page.waitForURL(/\/requests\//, { timeout: 10_000 }),
      card.click(),
    ]);
    const cardClickToRouteMs = Date.now() - startedAt;

    expect(
      cardClickToRouteMs,
      `card click→route ${cardClickToRouteMs}ms at ${CLICK_DELAY_MS}ms after commit`,
    ).toBeLessThan(NAV_CLICK_BUDGET_MS);
  });
});
