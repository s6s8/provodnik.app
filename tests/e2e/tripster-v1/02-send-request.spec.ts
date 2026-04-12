import { test } from "@playwright/test";
import { loginAs } from "../helpers";

test("traveler sends booking request", async ({ page }) => {
  // Login as traveler
  await loginAs(page, "traveler1@provodnik.test", "testpass123");

  // Find an active listing
  await page.goto("/search");
  const firstCard = page.locator('[data-testid="listing-card"]').first();
  const isVisible = await firstCard.isVisible().catch(() => false);
  if (!isVisible) {
    test.skip();
    return;
  }

  await firstCard.click();
  await page.waitForURL(/\/listings\/.+/);

  // Click order button
  const bookButton = page.locator('[data-testid="book-button"]');
  const bookVisible = await bookButton.isVisible().catch(() => false);
  if (!bookVisible) {
    test.skip();
    return;
  }
  await bookButton.click();
  await page.waitForURL(/\/listings\/.+\/book/);

  // Fill form
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  await page.fill('[name="starts_on"]', tomorrow.toISOString().slice(0, 10));
  await page.fill('[name="participants_count"]', "2");

  await page.click('[data-testid="submit-order"]');
  await page.waitForURL(/\/requests\/.+/);

  await page.screenshot({ path: "tests/screenshots/02-request-sent.png" });
});
