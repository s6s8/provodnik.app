// Request-detail collision proof: header vs join panel/CTA, per role, per viewport.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = process.argv[2] ?? "/tmp/proof";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:3000";
const REQ = process.argv[3];
const PASSWORD = "WbQa!2026#local";

const ROLES = [
  { name: "guest", email: null },
  { name: "traveler", email: "oleg.smirnov@provodnik.app" }, // not the owner
  { name: "owner", email: "irina.petrova@provodnik.app" },
];
const VIEWPORTS = [
  { name: "1280", width: 1280, height: 800 },
  { name: "375", width: 375, height: 812 },
];

async function login(page, email) {
  await page.goto(`${BASE}/auth`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
}

const browser = await chromium.launch();
for (const role of ROLES) {
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

    if (role.email) await login(page, role.email);
    const resp = await page.goto(`${BASE}/requests/${REQ}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const m = await page.evaluate(() => {
      const header = document.querySelector("header");
      const hb = header?.getBoundingClientRect();
      // The header's own painted chrome (the floating pill), not the wrapper box.
      const pill = header?.firstElementChild?.getBoundingClientRect();
      const headerBottom = pill ? pill.bottom : hb ? hb.bottom : 0;

      // Anything that looks like the join panel / CTA.
      const cta = [...document.querySelectorAll("a,button")].find((e) =>
        /Присоединиться|Отменить участие|Вы в группе/i.test(e.textContent || ""),
      );
      // The trip panel: the card carrying the price + join CTA inside the hero.
      const heroSection = document.querySelector("section");
      // TripPanel: the md:w-[334px] glass card carrying price + join CTA.
      const panel = heroSection?.querySelector('div.md\\:w-\\[334px\\]');

      const r = (e) => {
        if (!e) return null;
        const b = e.getBoundingClientRect();
        return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), h: Math.round(b.height) };
      };
      const overlaps = (el) => {
        if (!el) return null;
        const b = el.getBoundingClientRect();
        // Does the element intrude into the band the header paints over?
        return b.top < headerBottom && b.bottom > 0;
      };
      // Is the CTA actually clickable, or is the header on top of it?
      let ctaCovered = null;
      if (cta) {
        const b = cta.getBoundingClientRect();
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        if (cy > 0 && cy < window.innerHeight) {
          const hit = document.elementFromPoint(cx, cy);
          ctaCovered = !(hit === cta || cta.contains(hit));
        }
      }
      const doc = document.documentElement;
      return {
        headerBottom: Math.round(headerBottom),
        heroSection: r(heroSection),
        panel: r(panel),
        panelUnderHeader: overlaps(panel),
        cta: cta ? { text: cta.textContent.trim().slice(0, 30), ...r(cta) } : null,
        ctaUnderHeader: overlaps(cta),
        ctaCovered,
        horizontalOverflow: doc.scrollWidth > doc.clientWidth,
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
      };
    });

    await page.screenshot({ path: `${OUT}/req-${role.name}-${vp.name}.png` });
    console.log(`\n=== ${role.name} @ ${vp.name} — HTTP ${resp?.status()} ===`);
    console.log(JSON.stringify(m, null, 1));
    console.log(`console errors: ${errors.length ? errors.join(" | ") : "none"}`);
    await ctx.close();
  }
}
await browser.close();
