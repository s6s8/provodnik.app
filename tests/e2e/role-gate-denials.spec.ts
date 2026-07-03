import { expect, test } from "@playwright/test";

// Role-gate denials — the security boundary the refactor must never weaken.
// An anonymous visitor to any role-scoped workspace must be bounced to /auth by the
// edge proxy (src/proxy.ts → redirectToAuth). This holds with or without Supabase env
// (the no-session branch redirects in both cases), so it needs no seeded accounts and
// runs as a real, non-skipped assertion.
const PROTECTED_ROUTES = [
  { path: "/trips", role: "traveler" },
  { path: "/guide/profile", role: "guide" },
  { path: "/admin", role: "admin" },
  { path: "/bookings/00000000-0000-4000-8000-000000000000", role: "traveler" },
];

for (const { path, role } of PROTECTED_ROUTES) {
  test(`anonymous visitor is denied ${role} route ${path}`, async ({ page }) => {
    await page.goto(path);
    // The proxy redirects to /auth (with a ?redirect_to back-link) before the
    // protected page renders.
    await expect(page).toHaveURL(/\/auth(\?|$)/);
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
}
