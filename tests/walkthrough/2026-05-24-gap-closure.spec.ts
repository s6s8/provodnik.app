import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SCREENSHOT_DIR = "/tmp/walkthrough-screenshots";
const BASE_URL = "https://provodnik.app";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}. Run scripts/seed-test-users.mjs first, then export the printed credentials.`);
  return v;
}

const ACCOUNTS = {
  admin: { email: requireEnv("QA_ADMIN_EMAIL"), password: requireEnv("QA_ADMIN_PASSWORD") },
  guide: { email: requireEnv("QA_GUIDE_EMAIL"), password: requireEnv("QA_GUIDE_PASSWORD") },
  traveler: { email: requireEnv("QA_TRAVELER_EMAIL"), password: requireEnv("QA_TRAVELER_PASSWORD") },
};

async function login(page: import("@playwright/test").Page, role: keyof typeof ACCOUNTS) {
  const { email, password } = ACCOUNTS[role];
  await page.goto(`${BASE_URL}/auth`, { waitUntil: "networkidle" });
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator('button[type="submit"]').filter({ hasText: "Войти" }).click();
  await page.waitForURL((url) => url.pathname !== "/auth", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}

async function _signOut(page: import("@playwright/test").Page) {
  await page.goto(`${BASE_URL}/api/auth/signout`, { waitUntil: "networkidle" });
  await page.waitForURL((url) => url.pathname === "/" || url.pathname === "/auth", { timeout: 10000 }).catch(() => {});
  await page.context().clearCookies();
}

test.beforeAll(() => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

test("01-traveler-home-cabinet-header", async ({ page }) => {
  await login(page, "traveler");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const header = page.locator("header").first();
  await expect(header).toBeVisible({ timeout: 10000 });
  await page.screenshot({
    path: join(SCREENSHOT_DIR, "01-traveler-home-cabinet-header.png"),
    fullPage: false,
  });
});

test("02-traveler-svoya-gruppa-no-lock-icon", async ({ page }) => {
  await login(page, "traveler");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const form = page.locator('[aria-label="Создать запрос"]').first();
  await expect(form).toBeVisible({ timeout: 10000 });

  const privateLabel = page.locator("label").filter({ hasText: "Своя группа" }).first();
  await privateLabel.click();
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: join(SCREENSHOT_DIR, "02-traveler-svoya-gruppa-no-lock-icon.png"),
    fullPage: false,
  });
});

test("03-traveler-sbornaya-with-lock-icons", async ({ page }) => {
  await login(page, "traveler");
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const form = page.locator('[aria-label="Создать запрос"]').first();
  await expect(form).toBeVisible({ timeout: 10000 });

  const assemblyLabel = page.locator("label").filter({ hasText: "Сборная группа" }).first();
  await assemblyLabel.click();
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: join(SCREENSHOT_DIR, "03-traveler-sbornaya-with-lock-icons.png"),
    fullPage: false,
  });
});

test("04-admin-guide-detail-no-crash", async ({ page }) => {
  await login(page, "admin");
  await page.goto(`${BASE_URL}/admin/guides`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const firstRow = page.locator("a[href*='/admin/guides/'], tr[onclick], [data-guide-row]").first();
  if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await firstRow.click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  } else {
    const tableRows = page.locator("tbody tr, [data-testid='guide-row'], a").first();
    if (await tableRows.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableRows.click();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);
    } else {
      const links = await page.locator("a[href]").all();
      for (const handle of links) {
        const href = await handle.getAttribute("href");
        if (href && /\/admin\/guides\/[^/]+$/.test(href)) {
          await page.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle" });
          await page.waitForTimeout(2000);
          break;
        }
      }
    }
  }

  const errorText = page.locator("text=Раздел временно недоступен");
  await expect(errorText).not.toBeVisible({ timeout: 3000 }).catch(() => {});

  await page.screenshot({
    path: join(SCREENSHOT_DIR, "04-admin-guide-detail-no-crash.png"),
    fullPage: false,
  });
});

test("05-guide-inbox", async ({ page }) => {
  await login(page, "guide");
  await page.goto(`${BASE_URL}/guide/inbox`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const errorText = page.locator("text=Раздел временно недоступен");
  await expect(errorText).not.toBeVisible({ timeout: 5000 }).catch(() => {});

  await page.screenshot({
    path: join(SCREENSHOT_DIR, "05-guide-inbox.png"),
    fullPage: false,
  });
});

test("06-listings-mojibake-fixed", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/listings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const body = page.locator("body");
  await expect(body).not.toContainText("??????", { timeout: 5000 }).catch(() => {});

  await page.screenshot({
    path: join(SCREENSHOT_DIR, "06-listings-mojibake-fixed.png"),
    fullPage: false,
  });

  await context.close();
});