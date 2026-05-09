import type { Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('[type="submit"]');
  // Wait for redirect away from /auth
  await page.waitForFunction(
    () => !window.location.pathname.startsWith("/auth"),
    { timeout: 10000 }
  );
}
