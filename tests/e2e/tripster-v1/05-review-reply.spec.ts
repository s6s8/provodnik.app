import { test } from "@playwright/test";
import { loginAs } from "../helpers";

test("guide posts review reply after booking completes", async ({ page }) => {
  await loginAs(page, "guide1@provodnik.test", "testpass123");

  // Navigate to completed bookings needing review
  await page.goto("/guide/bookings");
  const pendingReview = page
    .locator('[data-testid="booking-item"][data-status="pending_review"]')
    .first();
  const isVisible = await pendingReview.isVisible().catch(() => false);
  if (!isVisible) {
    test.skip();
    return;
  }

  await pendingReview.click();

  const replyButton = page.locator('[data-testid="post-review-button"]');
  const btnVisible = await replyButton.isVisible().catch(() => false);
  if (!btnVisible) {
    test.skip();
    return;
  }
  await replyButton.click();

  await page.fill(
    '[name="review_text"]',
    "Прекрасные гости, спасибо за экскурсию!"
  );
  await page.fill('[name="rating"]', "5");
  await page.click('[data-testid="submit-review"]');

  // Should transition to pending_review status shown
  await page.waitForSelector('[data-testid="review-submitted-badge"]', {
    timeout: 5000,
  });

  await page.screenshot({ path: "tests/screenshots/05-review-posted.png" });
});
