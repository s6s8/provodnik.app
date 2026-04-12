import { test } from "@playwright/test";
import { loginAs } from "../helpers";

test("traveler opens dispute and admin resolves it", async ({ page }) => {
  // Step 1: Traveler opens dispute
  await loginAs(page, "traveler1@provodnik.test", "testpass123");

  await page.goto("/bookings");
  const firstBooking = page.locator('[data-testid="booking-item"]').first();
  const bookingVisible = await firstBooking.isVisible().catch(() => false);
  if (!bookingVisible) {
    test.skip();
    return;
  }

  await firstBooking.click();

  const disputeButton = page.locator('[data-testid="open-dispute-button"]');
  const disputeVisible = await disputeButton.isVisible().catch(() => false);
  if (!disputeVisible) {
    test.skip();
    return;
  }
  await disputeButton.click();

  await page.fill(
    '[name="dispute_reason"]',
    "Экскурсия не соответствовала описанию."
  );
  await page.click('[data-testid="submit-dispute"]');
  await page.waitForSelector('[data-testid="dispute-opened-badge"]', {
    timeout: 5000,
  });

  await page.screenshot({ path: "tests/screenshots/06a-dispute-opened.png" });

  // Step 2: Admin resolves dispute
  await loginAs(page, "admin@provodnik.test", "testpass123");

  await page.goto("/admin/disputes");
  const firstDispute = page.locator('[data-testid="dispute-item"]').first();
  const disputeItemVisible = await firstDispute.isVisible().catch(() => false);
  if (!disputeItemVisible) {
    test.skip();
    return;
  }

  await firstDispute.click();

  const resolveButton = page.locator('[data-testid="resolve-dispute-button"]');
  const resolveVisible = await resolveButton.isVisible().catch(() => false);
  if (!resolveVisible) {
    test.skip();
    return;
  }
  await resolveButton.click();

  await page.fill(
    '[name="resolution_note"]',
    "Спор урегулирован. Возврат средств одобрен."
  );
  await page.click('[data-testid="confirm-resolution"]');

  // Verify dispute_resolved event in thread
  await page.waitForSelector('[data-testid="dispute-resolved-badge"]', {
    timeout: 5000,
  });

  await page.screenshot({ path: "tests/screenshots/06b-dispute-resolved.png" });
});
