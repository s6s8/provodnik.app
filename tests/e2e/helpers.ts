import { expect, type Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth");
  // Hydration replaces the server-rendered form with empty React state — values typed
  // too early are wiped and the submit button stays disabled. The reliable signal is the
  // button itself: refill until React state catches up and enables it. (networkidle is
  // useless here — the dev server's HMR websocket keeps the network permanently busy.)
  const submit = page.locator('button[type="submit"]');
  await expect(async () => {
    await page.fill("#email", email);
    await page.fill("#password", password);
    await expect(submit).toBeEnabled({ timeout: 2_000 });
  }).toPass({ timeout: 45_000 });
  await submit.click();
  // Wait for redirect away from /auth
  await page.waitForFunction(
    () => !window.location.pathname.startsWith("/auth"),
    { timeout: 30_000 },
  );
}
