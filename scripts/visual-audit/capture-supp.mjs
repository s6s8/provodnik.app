// Supplement: capture anna's booking-detail + review + dispute pages (the discover miss).
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
const BASE = "https://provodnik.app", PW = "Provodnik-QA-2026!";
const OUT = path.resolve("audit/screens/traveler");
const B = "d4000000-0000-4000-8000-000000000002";
const DISPUTE = "da000000-0000-4000-8000-000000000001";
const ROUTES = [`/bookings/${B}`, `/bookings/${B}/review`, `/bookings/${B}/dispute`, `/disputes/${DISPUTE}`];
const VPS = [{ t: "desktop", w: 1440, h: 900 }, { t: "mobile", w: 390, h: 844 }];
const slug = (p) => p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");
(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ ignoreHTTPSErrors: true });
  const lp = await c.newPage();
  await lp.goto(`${BASE}/auth?next=/account`, { waitUntil: "load", timeout: 45000 });
  await lp.waitForTimeout(800);
  await lp.fill("input[type=email]", "traveler.anna@demo.provodnik.app");
  await lp.fill("input[type=password]", PW);
  await Promise.all([lp.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 25000 }).catch(() => {}), lp.click("button[type=submit]")]);
  await lp.waitForTimeout(2000);
  console.log("login:", lp.url());
  await lp.close();
  await mkdir(OUT, { recursive: true });
  for (const r of ROUTES) for (const vp of VPS) {
    const p = await c.newPage();
    try {
      await p.setViewportSize({ width: vp.w, height: vp.h });
      const resp = await p.goto(`${BASE}${r}`, { waitUntil: "load", timeout: 45000 });
      await p.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(1500);
      await p.screenshot({ path: path.join(OUT, `${slug(r)}__${vp.t}.png`), fullPage: true });
      console.log(`  ${vp.t} ${r} [${resp?.status()}]`);
    } catch (e) { console.log(`  ${vp.t} ${r} ERR ${e.message}`); } finally { await p.close(); }
  }
  await b.close();
  console.log("SUPP DONE");
})();
