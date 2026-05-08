# Phase 13.1 — QA: Playwright happy paths

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p13-1`
**Branch:** `feat/tripster-v1-p13-1`

Tech stack: Next.js 15, Playwright, TypeScript, Bun.

**Existing Playwright setup:** Check `tests/` or `e2e/` for existing Playwright config and test files.

**Test accounts (from seed data):**
- Guide: guide1@provodnik.test / password: testpass123
- Traveler: traveler1@provodnik.test / password: testpass123
- Admin: admin@provodnik.test / password: testpass123

**Base URL:** `http://localhost:3000`

## SCOPE

**Create:**
1. `tests/e2e/tripster-v1/01-create-listing.spec.ts`
2. `tests/e2e/tripster-v1/02-send-request.spec.ts`
3. `tests/e2e/tripster-v1/03-offer-flow.spec.ts`
4. `tests/e2e/tripster-v1/04-booking-confirm.spec.ts`
5. `tests/e2e/tripster-v1/05-review-reply.spec.ts`
6. `tests/e2e/tripster-v1/06-dispute-flow.spec.ts`

**DO NOT touch:** Existing test files, `playwright.config.ts`.

## TASK

### Happy path 1: Create excursion listing (guide)

```ts
// 01-create-listing.spec.ts
test("guide creates an excursion listing", async ({ page }) => {
  await page.goto("/auth");
  await page.fill('[name="email"]', "guide1@provodnik.test");
  await page.fill('[name="password"]', "testpass123");
  await page.click('[type="submit"]');
  await page.waitForURL("/guide/dashboard");

  await page.goto("/guide/listings/new");
  // If FEATURE_TRIPSTER_V1 is on, should show type picker
  await page.waitForSelector('[data-testid="type-picker"]', { timeout: 5000 }).catch(() => {
    // Legacy editor — skip v1 test
    test.skip();
  });

  // Select excursion type
  await page.click('[data-testid="type-excursion"]');
  await page.waitForURL(/\/guide\/listings\/.+\/edit/);

  // Fill basics
  await page.fill('[name="title"]', "Тестовая экскурсия по центру");
  await page.fill('[name="region"]', "Москва");
  await page.fill('[name="description"]', "Описание тестовой экскурсии длиной более 100 символов для прохождения проверки качества контента.");
  
  // Autosave should trigger
  await page.waitForSelector('[data-testid="autosave-saved"]', { timeout: 5000 });
  
  // Take screenshot as evidence
  await page.screenshot({ path: "tests/screenshots/01-listing-created.png" });
});
```

### Happy path 2: Traveler sends request

```ts
// 02-send-request.spec.ts
test("traveler sends booking request", async ({ page }) => {
  // Login as traveler
  await loginAs(page, "traveler1@provodnik.test", "testpass123");
  
  // Find an active listing
  await page.goto("/search");
  const firstCard = page.locator('[data-testid="listing-card"]').first();
  if (!(await firstCard.isVisible())) { test.skip(); }
  
  await firstCard.click();
  await page.waitForURL(/\/listings\/.+/);
  
  // Click order button
  await page.click('[data-testid="book-button"]');
  await page.waitForURL(/\/listings\/.+\/book/);
  
  // Fill form
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 7);
  await page.fill('[name="starts_on"]', tomorrow.toISOString().slice(0, 10));
  await page.fill('[name="participants_count"]', "2");
  
  await page.click('[data-testid="submit-order"]');
  await page.waitForURL(/\/requests\/.+/);
  
  await page.screenshot({ path: "tests/screenshots/02-request-sent.png" });
});
```

### Happy path 3: Guide sends offer

```ts
// 03-offer-flow.spec.ts
test("guide sends offer on request", async ({ page }) => {
  await loginAs(page, "guide1@provodnik.test", "testpass123");
  
  await page.goto("/guide/requests");
  const firstRequest = page.locator('[data-testid="request-item"]').first();
  if (!(await firstRequest.isVisible())) { test.skip(); }
  
  await firstRequest.click();
  await page.click('[data-testid="send-offer-button"]');
  
  await page.fill('[name="price"]', "5000");
  await page.fill('[name="message"]', "Отличный выбор! Буду рад провести экскурсию.");
  await page.click('[data-testid="submit-offer"]');
  
  await page.waitForSelector('[data-testid="offer-sent-badge"]');
  await page.screenshot({ path: "tests/screenshots/03-offer-sent.png" });
});
```

### Happy paths 4–6: Booking confirm, review, dispute

Write similarly structured tests for:
- **04**: Traveler accepts offer → booking confirmed
- **05**: Guide posts review reply after booking completes → pending_review status
- **06**: Traveler opens dispute → admin resolves → dispute_resolved event in thread

Each test:
- Starts with `loginAs(page, email, password)`
- Navigates to the right page
- Performs the action
- Takes a screenshot
- Uses `test.skip()` if the page/element is not found (graceful degradation)

### Helper: loginAs

Add to a `tests/e2e/helpers.ts` file:
```ts
import type { Page } from "@playwright/test";

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('[type="submit"]');
  // Wait for redirect away from /auth
  await page.waitForFunction(() => !window.location.pathname.startsWith("/auth"), { timeout: 10000 });
}
```

## INVESTIGATION RULE

Before writing, read:
- `playwright.config.ts` — base URL, test directory, browser config
- Existing test files for patterns (auth helpers, selectors)
- `src/app/(protected)/guide/` — understand route structure for navigation

Use `data-testid` attributes where needed — but if the existing UI doesn't have them, use CSS selectors or text matchers (`page.getByText`, `page.getByRole`).

## TDD CONTRACT

Tests must be valid TypeScript. Run: `bun run playwright test tests/e2e/tripster-v1/ --reporter=list` to verify they at least parse.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p13-1`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`

## DONE CRITERIA

- 7 files created (6 spec + 1 helper)
- All spec files are valid TypeScript (no compile errors)
- `bun run typecheck` exits 0
- Commit: `test(e2e): Playwright happy paths — create listing / send request / offer / booking / review / dispute`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
