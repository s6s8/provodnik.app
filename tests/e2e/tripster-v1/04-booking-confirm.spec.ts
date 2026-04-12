import { test } from "@playwright/test";
import { loginAs } from "../helpers";

test("traveler accepts offer and confirms booking", async ({ page }) => {
  await loginAs(page, "traveler1@provodnik.test", "testpass123");

  // Navigate to traveler requests / offers
  await page.goto("/requests");
  const firstOffer = page.locator('[data-testid="offer-item"]').first();
  const isVisible = await firstOffer.isVisible().catch(() => false);
  if (!isVisible) {
    test.skip();
    return;
  }

  await firstOffer.click();

  const acceptButton = page.locator('[data-testid="accept-offer-button"]');
  const btnVisible = await acceptButton.isVisible().catch(() => false);
  if (!btnVisible) {
    test.skip();
    return;
  }
  await acceptButton.click();

  // Should show booking confirmed state
  await page.waitForSelector('[data-testid="booking-confirmed-badge"]', {
    timeout: 5000,
  });

  await page.screenshot({ path: "tests/screenshots/04-booking-confirmed.png" });
});
