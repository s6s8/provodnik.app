// Visual-audit capture harness — Mira's Visual Gate, Stage 1.
// Logs in per role on prod, walks every route, full-page top-down screenshots @desktop+mobile.
// Run: node scripts/visual-audit/capture.mjs   (needs playwright + chromium installed)
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.AUDIT_BASE || "https://provodnik.app";
// Authoritative QA credentials live in tests/e2e/fixtures.ts (SEED_USERS). The
// old *@demo.provodnik.app demo accounts no longer authenticate on prod.
// Never hard-code the password — read it from the environment.
const PW = process.env.AUDIT_PW || process.env.QA_SEED_PASSWORD || "";
const OUT = path.resolve("audit/screens");
const ACCOUNTS = {
  traveler: "qa-traveler@example.com",
  guide: "qa-guide@example.com",
  admin: "qa-admin@example.com",
};
const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
];

// Stable demo IDs (from prod)
const LISTING = "d1000000-0000-4000-8000-000000000011";
const REQUEST = "93061ea4-2547-4821-b852-6234079daca0";
const DEST = "elista";
const GUIDE = "d0000000-0000-4000-8000-000000000101"; // Баатр
const DISPUTE = "da000000-0000-4000-8000-000000000001";

// path | role(public/traveler/guide/admin) | dyn{discoverFrom,linkRe} for user-specific detail pages
const ROUTES = [
  // public
  ["/", "public"], ["/ai", "public"], ["/form", "public"],
  ["/listings", "public"], [`/listings/${LISTING}`, "public"],
  ["/destinations", "public"], [`/destinations/${DEST}`, "public"],
  ["/guides", "public"], [`/guide/${GUIDE}`, "public"],
  ["/requests", "public"], [`/requests/${REQUEST}`, "public"],
  ["/search", "public"], ["/how-it-works", "public"], ["/become-a-guide", "public"],
  ["/for-business", "public"], ["/help", "public"], ["/trust", "public"],
  ["/policies/privacy", "public"], ["/policies/terms", "public"], ["/policies/cookies", "public"],
  ["/auth", "public"], ["/auth/forgot-password", "public"],
  // traveler cabinet
  ["/account", "traveler"], ["/account/notifications", "traveler"],
  ["/trips", "traveler"], ["/favorites", "traveler"], ["/notifications", "traveler"],
  ["/referrals", "traveler"], ["/messages", "traveler"],
  [`/listings/${LISTING}/book`, "traveler"],
  ["__discover_booking", "traveler", { discoverFrom: "/trips", linkRe: "/bookings/[0-9a-f-]+$" }],
  ["__discover_thread", "traveler", { discoverFrom: "/messages", linkRe: "/messages/[0-9a-f-]+$" }],
  // guide cabinet
  ["/guide", "guide"], ["/guide/bookings", "guide"], ["/guide/calendar", "guide"],
  ["/guide/inbox", "guide"], ["/guide/listings", "guide"], ["/guide/profile", "guide"],
  ["/guide/reviews", "guide"], ["/guide/stats", "guide"],
  ["/guide/settings/contact-visibility", "guide"],
  ["__discover_gbooking", "guide", { discoverFrom: "/guide/bookings", linkRe: "/guide/bookings/[0-9a-f-]+$" }],
  // admin
  ["/admin", "admin"], ["/admin/dashboard", "admin"], ["/admin/audit", "admin"],
  ["/admin/bookings", "admin"], ["/admin/disputes", "admin"], [`/admin/disputes/${DISPUTE}`, "admin"],
  ["/admin/guides", "admin"], [`/admin/guides/${GUIDE}`, "admin"],
  ["/admin/listings", "admin"], ["/admin/moderation", "admin"],
];

const slug = (p) => p.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";

async function login(context, email) {
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/auth?next=/account`, { waitUntil: "load", timeout: 45000 });
    await page.waitForTimeout(800);
    if (!(await page.$("input[type=email]"))) {
      await page.goto(`${BASE}/account`, { waitUntil: "load", timeout: 45000 });
      await page.waitForTimeout(800);
    }
    await page.fill("input[type=email]", email);
    await page.fill("input[type=password]", PW);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 25000 }).catch(() => {}),
      page.click("button[type=submit]"),
    ]);
    await page.waitForTimeout(2000);
    const ok = !page.url().includes("/auth");
    console.log(`  login ${email}: ${ok ? "OK" : "STILL ON /auth"} -> ${page.url()}`);
    return ok;
  } finally {
    await page.close();
  }
}

async function resolvePath(context, entry) {
  const [p, , dyn] = entry;
  if (!dyn) return p;
  const page = await context.newPage();
  try {
    await page.goto(`${BASE}${dyn.discoverFrom}`, { waitUntil: "load", timeout: 45000 });
    await page.waitForTimeout(1500);
    const re = new RegExp(dyn.linkRe);
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
    const hit = hrefs.find((h) => h && re.test(h));
    console.log(`  discover ${p} via ${dyn.discoverFrom}: ${hit || "NONE"}`);
    return hit || null;
  } catch (e) {
    console.log(`  discover ${p} FAILED: ${e.message}`);
    return null;
  } finally {
    await page.close();
  }
}

async function shoot(context, realPath, label, results) {
  for (const vp of VIEWPORTS) {
    const page = await context.newPage();
    try {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const resp = await page.goto(`${BASE}${realPath}`, { waitUntil: "load", timeout: 45000 });
      await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const dir = path.join(OUT, label.split("/")[0]);
      await mkdir(dir, { recursive: true });
      const file = path.join(dir, `${slug(realPath)}__${vp.tag}.png`);
      await page.screenshot({ path: file, fullPage: true });
      results.push({ path: realPath, role: label.split("/")[0], vp: vp.tag, status: resp?.status() ?? 0, file });
      console.log(`    ${vp.tag} ${realPath} [${resp?.status()}] -> ${path.basename(file)}`);
    } catch (e) {
      results.push({ path: realPath, role: label.split("/")[0], vp: vp.tag, error: e.message });
      console.log(`    ${vp.tag} ${realPath} ERROR: ${e.message}`);
    } finally {
      await page.close();
    }
  }
}

(async () => {
  const results = [];
  const browser = await chromium.launch({ headless: true });
  const byRole = {};
  for (const e of ROUTES) (byRole[e[1]] ||= []).push(e);

  for (const role of ["public", "traveler", "guide", "admin"]) {
    const entries = byRole[role] || [];
    if (!entries.length) continue;
    console.log(`\n=== ROLE: ${role} (${entries.length} routes) ===`);
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    if (role !== "public") {
      const ok = await login(context, ACCOUNTS[role]);
      if (!ok) { console.log(`  !! ${role} login failed, capturing anyway (will show redirects)`); }
    }
    for (const entry of entries) {
      const real = await resolvePath(context, entry);
      if (!real) { results.push({ path: entry[0], role, skipped: "no-id" }); continue; }
      await shoot(context, real, `${role}/${slug(real)}`, results);
    }
    await context.close();
  }
  await browser.close();
  await mkdir(OUT, { recursive: true });
  await writeFile(path.join(OUT, "..", "manifest.json"), JSON.stringify(results, null, 2));
  const ok = results.filter((r) => r.file).length;
  console.log(`\nDONE: ${ok} screenshots, ${results.filter((r) => r.error || r.skipped).length} issues. manifest.json written.`);
})();
