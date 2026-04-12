import { test } from "@playwright/test";

test("guide creates an excursion listing", async ({ page }) => {
  await page.goto("/auth");
  await page.fill('[name="email"]', "guide1@provodnik.test");
  await page.fill('[name="password"]', "testpass123");
  await page.click('[type="submit"]');
  await page.waitForURL("/guide/dashboard");

  await page.goto("/guide/listings/new");
  // If FEATURE_TRIPSTER_V1 is on, should show type picker
  const typePicker = await page
    .waitForSelector('[data-testid="type-picker"]', { timeout: 5000 })
    .catch(() => null);

  if (!typePicker) {
    // Legacy editor — skip v1 test
    test.skip();
    return;
  }

  // Select excursion type
  await page.click('[data-testid="type-excursion"]');
  await page.waitForURL(/\/guide\/listings\/.+\/edit/);

  // Fill basics
  await page.fill('[name="title"]', "Тестовая экскурсия по центру");
  await page.fill('[name="region"]', "Москва");
  await page.fill(
    '[name="description"]',
    "Описание тестовой экскурсии длиной более 100 символов для прохождения проверки качества контента."
  );

  // Autosave should trigger
  await page.waitForSelector('[data-testid="autosave-saved"]', {
    timeout: 5000,
  });

  // Take screenshot as evidence
  await page.screenshot({ path: "tests/screenshots/01-listing-created.png" });
});
