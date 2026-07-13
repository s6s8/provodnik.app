// DESIGN_REFACTOR_PLAN §7.4-§7.6 — the design gate.
//
// For every public route × 3 viewports: screenshot into .design-audit/AFTER/,
// assert no horizontal overflow at 375px, and record console errors.
// For the high-traffic routes: axe (wcag2a + wcag2aa), 0 critical/serious.
//
// Run against the LOCAL seeded stack (see .goal/PLAYBOOK.md) — never prod.
import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";

const OUT = ".design-audit/AFTER";

const VIEWPORTS = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

/** Routes reachable without a session. */
const ROUTES: ReadonlyArray<readonly [string, string]> = [
  ["home", "/"],
  ["ai", "/ai"],
  ["become_a_guide", "/become-a-guide"],
  ["for_business", "/for-business"],
  ["help", "/help"],
  ["how_it_works", "/how-it-works"],
  ["trust", "/trust"],
  ["policies_cookies", "/policies/cookies"],
  ["policies_offer", "/policies/offer"],
  ["policies_privacy", "/policies/privacy"],
  ["policies_terms", "/policies/terms"],
  ["auth", "/auth"],
  ["auth_forgot_password", "/auth/forgot-password"],
  ["guides", "/guides"],
  ["requests", "/requests"],
  ["not_found", "/__no_such_route__"],
];

const AXE_ROUTES = ["/", "/auth", "/guides", "/requests", "/help", "/how-it-works"];

test.beforeAll(() => {
  fs.mkdirSync(OUT, { recursive: true });
});

for (const [slug, path] of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`capture ${slug} @${vp.name}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.screenshot({ path: `${OUT}/${slug}-${vp.name}.png`, fullPage: true });

      if (consoleErrors.length) {
        fs.appendFileSync(
          `${OUT}/console-errors.log`,
          `${path} @${vp.name}\n  ${consoleErrors.join("\n  ")}\n`,
        );
      }

      // The audit's mobile breaks were all horizontal overflow. Gate it.
      if (vp.name === "375") {
        const scrollWidth = await page.evaluate(
          () => document.documentElement.scrollWidth,
        );
        expect(
          scrollWidth,
          `${path} overflows horizontally at 375px (scrollWidth=${scrollWidth})`,
        ).toBeLessThanOrEqual(vp.width);
      }
    });
  }
}

for (const path of AXE_ROUTES) {
  test(`axe ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path, { waitUntil: "networkidle" });

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const blocking = violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );

    fs.appendFileSync(
      `${OUT}/axe.log`,
      `${path}: ${blocking.length} critical/serious` +
        (blocking.length
          ? ` — ${blocking.map((v) => `${v.id}×${v.nodes.length}`).join(", ")}\n`
          : "\n"),
    );

    expect(
      blocking.map((v) => `${v.id} ×${v.nodes.length}`),
      `${path} has critical/serious axe violations`,
    ).toEqual([]);
  });
}
