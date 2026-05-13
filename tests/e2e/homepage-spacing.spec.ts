import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SECTION_SELECTOR =
  'section[aria-label="Открытые запросы путешественников"]';

function screenshotPath(filename: string): string {
  return join(process.cwd(), "test-results", filename);
}

test.beforeAll(() => {
  mkdirSync(join(process.cwd(), "test-results"), { recursive: true });
});

test("guest home at 375×812: discovery section padding-bottom 64px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const section = page.locator(SECTION_SELECTOR);
  await expect(section).toBeVisible();
  const paddingBottom = await section.evaluate(
    (el) => getComputedStyle(el).paddingBottom,
  );
  expect(paddingBottom).toBe("96px");
  await page.screenshot({
    path: screenshotPath("homepage-spacing-375.png"),
    fullPage: true,
  });
});

test("guest home at 1280×800: discovery section padding-bottom 96px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const section = page.locator(SECTION_SELECTOR);
  await expect(section).toBeVisible();
  const paddingBottom = await section.evaluate(
    (el) => getComputedStyle(el).paddingBottom,
  );
  expect(paddingBottom).toBe("160px");
  await page.screenshot({
    path: screenshotPath("homepage-spacing-1280.png"),
    fullPage: true,
  });
});
