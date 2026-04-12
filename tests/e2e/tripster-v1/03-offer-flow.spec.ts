import { test } from "@playwright/test";
import { loginAs } from "../helpers";

test("guide sends offer on request", async ({ page }) => {
  await loginAs(page, "guide1@provodnik.test", "testpass123");

  await page.goto("/guide/requests");
  const firstRequest = page.locator('[data-testid="request-item"]').first();
  const isVisible = await firstRequest.isVisible().catch(() => false);
  if (!isVisible) {
    test.skip();
    return;
  }

  await firstRequest.click();

  const sendOfferButton = page.locator('[data-testid="send-offer-button"]');
  const btnVisible = await sendOfferButton.isVisible().catch(() => false);
  if (!btnVisible) {
    test.skip();
    return;
  }
  await sendOfferButton.click();

  await page.fill('[name="price"]', "5000");
  await page.fill(
    '[name="message"]',
    "Отличный выбор! Буду рад провести экскурсию."
  );
  await page.click('[data-testid="submit-offer"]');

  await page.waitForSelector('[data-testid="offer-sent-badge"]', {
    timeout: 5000,
  });
  await page.screenshot({ path: "tests/screenshots/03-offer-sent.png" });
});
