import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

import { E2E_READY } from "./fixtures";

/**
 * Wildberries 2026-07-13 feedback — browser evidence for the numbered items 1–18.
 *
 * Each test drives the real UI at 1440px AND 375px, asserts the requested behaviour,
 * and writes the screenshot that backs the ledger entry. A route returning 200, a
 * source grep, or a green unit test is NOT accepted as proof of any of these: several
 * items looked correct in source and were broken in the browser, and one looked broken
 * and was correct.
 *
 * Requires a LOCAL seeded stack (never prod):
 *   bun scripts/seed-test-users.mjs .env.local && bun scripts/seed-qa-content.mjs .env.local
 *   WB_EVIDENCE=1 WB_REQUEST_ID=<uuid> bunx playwright test tests/e2e/wildberries-evidence.spec.ts
 *
 * Off unless WB_EVIDENCE is set, so the normal `bun run playwright` gate never depends
 * on fixture content that only exists on a seeded local database.
 */

const SHOTS = "docs/qa/wildberries-2026-07-14/screenshots";
const VIEWPORTS = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 375, height: 812 },
] as const;

type Role = "admin" | "guide" | "traveler" | null;
type Viewport = (typeof VIEWPORTS)[number];

test.skip(!process.env.WB_EVIDENCE, "evidence run only (needs the seeded local fixture)");
test.skip(!E2E_READY, "QA_SEED_PASSWORD not set");

// Each test drives the full flow twice (1440 + 375) against a dev server that compiles
// routes on first hit. The default 30s is a stopwatch on the bundler, not on the app.
test.describe.configure({ timeout: 150_000 });

test.beforeAll(() => mkdirSync(SHOTS, { recursive: true }));

/**
 * Screenshot hygiene. Two things must never end up in an evidence picture:
 *  - the Next dev-tools badge (a dev artifact, not product UI);
 *  - a full email address. The admin console shows admins the real address by design,
 *    and every account here is a synthetic fixture, but the evidence package still
 *    redacts them rather than publishing address-shaped strings. The redaction is
 *    visible as a mask, never a silent edit.
 */
async function cleanCapture(page: Page) {
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const emails = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
    const nodes: Text[] = [];
    while (walker.nextNode()) nodes.push(walker.currentNode as Text);
    for (const node of nodes) {
      if (node.nodeValue && emails.test(node.nodeValue)) {
        node.nodeValue = node.nodeValue.replace(emails, (m) => `${m[0]}•••@${m.split("@")[1]}`);
      }
    }
  });
}

/** Run `body` in a fresh context per viewport, so every item is proven at both sizes. */
function eachViewport(
  browser: Browser,
  role: Role,
  body: (page: Page, vp: Viewport, shot: (name: string) => Promise<void>) => Promise<void>,
) {
  return Promise.all([]).then(async () => {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        ...(role ? { storageState: `playwright/.auth/${role}.json` } : {}),
      });
      const page = await context.newPage();
      const shot = async (name: string) => {
        await cleanCapture(page);
        await page.screenshot({ path: `${SHOTS}/${name}-${vp.tag}.png` });
      };
      try {
        await body(page, vp, shot);
      } finally {
        await context.close();
      }
    }
  });
}

/** Reveal a region and let images settle, so no screenshot catches a skeleton. */
async function settle(page: Page, locator?: Locator) {
  if (locator) await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
}

function userLink(page: Page, name: string) {
  return page.getByRole("link", { name, exact: true }).first();
}

/**
 * Fill the homepage request form the way a person would: the destination is a real
 * combobox (typing, not `fill`, or React never sees the change), the date comes from
 * the calendar, and at least one theme is required — an incomplete form never reaches
 * the auth gate, it just re-renders with validation errors.
 */
async function fillRequestForm(page: Page, opts: { guests: string; budget: string }) {
  const destination = page.locator("#destination");
  await destination.click();
  await destination.pressSequentially("Эли", { delay: 80 });
  await expect(page.getByRole("option", { name: "Элиста" })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(destination).toHaveValue("Элиста");

  await page.locator("#startDate").click();
  await page.locator("[role=gridcell] button:not([disabled])").last().click();
  await closeOverlays(page);

  await page.getByText("Темы", { exact: true }).first().click();
  await page.getByRole("option", { name: "История и культура" }).click();
  await closeOverlays(page);

  await page.locator("#groupSize").fill(opts.guests);
  await page.locator("#budgetPerPersonRub").fill(opts.budget);
}

/**
 * Dismiss any open popover and WAIT for it to actually go. At 375px the themes
 * popover covers the fields below it, so the next `fill()` sits there blocked on
 * actionability until the test times out — which looks like a hang, not a covered
 * element. Pressing Escape without waiting for the dismissal just moves the race.
 */
async function closeOverlays(page: Page) {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("option")).toHaveCount(0);
  await expect(page.getByRole("gridcell")).toHaveCount(0);
}

// ---------------------------------------------------------------------------
// 1. Admin: filter guides by region / base city
// ---------------------------------------------------------------------------
test("01 admin filters guides by region and base city", async ({ browser }) => {
  await eachViewport(browser, "admin", async (page, _vp, shot) => {
    await page.goto("/admin/users?role=guide&baseCity=Астрахань");
    await expect(page.getByRole("heading", { name: "Пользователи" })).toBeVisible();
    await expect(page.getByLabel("Фильтр по базовому городу гида")).toHaveValue("Астрахань");

    // A real DB filter, not a client-side hide: the Astrakhan guide survives, the
    // Elista/Sochi ones are gone.
    await expect(userLink(page, "Наян Задваев")).toBeVisible();
    await expect(page.getByRole("link", { name: "Баир Очиров", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Сунил Мунилов", exact: true })).toHaveCount(0);
    await settle(page);
    await shot("01-admin-base-city-filter");

    // Region: a select fed from the guides' own free-text regions.
    await page.goto("/admin/users?role=guide&region=Калмыкия");
    await expect(userLink(page, "Баир Очиров")).toBeVisible();
    await expect(userLink(page, "Гиляна Манджиева")).toBeVisible();
    await expect(page.getByRole("link", { name: "Наян Задваев", exact: true })).toHaveCount(0);
    await settle(page);
    await shot("01-admin-region-filter");
  });
});

// ---------------------------------------------------------------------------
// 2. Admin: detailed analytics
// ---------------------------------------------------------------------------
test("02 admin analytics answers the six demand questions", async ({ browser }) => {
  await eachViewport(browser, "admin", async (page, _vp, shot) => {
    await page.goto("/admin/analytics");
    await expect(page.getByRole("heading", { name: "Аналитика" })).toBeVisible();

    for (const q of [
      "1. Спрос по направлениям",
      "2. Воронка: запрос → предложение → бронирование",
      "3. Предложение по регионам",
      "4. Сезонность",
      "5. Разрыв спроса и предложения",
      "6. Бронирования по месяцам",
    ]) {
      await expect(page.getByRole("heading", { name: q })).toBeVisible();
    }
    // Real rows, not placeholders: the seeded Elista demand and Kalmykia supply show up.
    await expect(page.getByText("Элиста").first()).toBeVisible();
    await expect(page.getByText("Калмыкия").first()).toBeVisible();
    await settle(page);
    await shot("02-admin-analytics");
  });
});

// ---------------------------------------------------------------------------
// 3. Admin: the save button reaches a terminal state (no infinite "сохраняет")
// ---------------------------------------------------------------------------
test("03 admin role save reports a terminal result", async ({ browser }) => {
  // The reported bug (msg 541 #3, and msg 590): flipping a guide to admin left the save
  // button spinning «сохраняет» forever. Proving that needs the REAL flip — the button is
  // disabled while the selection still equals the current role (correct, and why a
  // "click save" test proves nothing).
  //
  // The mutating round trip runs once, at 1440, and restores the fixture. At 375 the same
  // controls are verified present and correctly gated, without a second write to a shared
  // fixture — two mutating passes over one account is a fixture-safety problem, not extra
  // coverage.
  await eachViewport(browser, "admin", async (page, vp, shot) => {
    await page.goto("/admin/users?q=Сунил");
    await userLink(page, "Сунил Мунилов").click();
    await expect(page.getByRole("heading", { name: "Сунил Мунилов" })).toBeVisible();

    const select = page.locator("#role-select");
    const save = page.getByRole("button", { name: "Сменить роль" });
    await expect(select).toHaveText("Гид");

    if (vp.tag === "mobile") {
      // Controls reachable at 375px, and the no-op save is refused by design.
      await expect(save).toBeVisible();
      await expect(save).toBeDisabled();
      await settle(page);
      await shot("03-admin-role-controls");
      return;
    }

    async function changeRole(to: string, from: string, reason: string) {
      await expect(select).toHaveText(from);
      await page.getByLabel("Причина (обязательно)").fill(reason);
      await select.click();
      await page.getByRole("option", { name: to, exact: true }).click();
      await expect(save).toBeEnabled();

      const started = Date.now();
      await save.click();
      // Wait on a true POST-CONDITION of the finished save, not on a banner. Two earlier
      // attempts waited on things that were already on the page — the text «Роль обновлена»
      // (it also sits in the «Журнал аудита» below) and role="status" (a live region that
      // is always mounted). Both resolved instantly, so the test raced the server action
      // and then "proved" a stale public page — a phantom bug that cost real time.
      //
      // On success the action refreshes the server component, `currentRole` becomes the
      // new role, and the button disables itself again because selection === current.
      // That state cannot exist until the write has actually landed.
      await expect(select).toHaveText(to, { timeout: 15_000 });
      await expect(save).toBeDisabled({ timeout: 15_000 });
      return Date.now() - started;
    }

    try {
      const elapsed = await changeRole("Администратор", "Гид", "QA: проверка отклика кнопки");
      console.log(`[item 03] guide → admin settled in ${elapsed}ms`);
      expect(elapsed).toBeLessThan(15_000);
      await settle(page);
      await shot("03-admin-role-save-feedback");
    } finally {
      await page.goto(page.url().split("?")[0]);
      await changeRole("Гид", "Администратор", "QA: возврат роли гида");
    }

    // The round trip must not cost the guide their public identity — that is the whole of
    // msg 590: after guide → admin → guide the public grid started showing a username and
    // the guide vanished from /guides. Raw HTTP, so nothing client-side can mask it.
    //
    // `poll`, not a single GET, and deliberately so: /guides/[slug] carries
    // `revalidate = 3600`, and the FIRST anonymous request after the write can still be
    // served the pre-change render (ISR stale-while-revalidate) before the next one is
    // correct. Verified: the DB is already right at that moment. So the identity claim is
    // "the public page settles on the restored identity", and the one-request staleness
    // window is written up as a finding rather than asserted away. See LEDGER item 3.
    await expect
      .poll(async () => (await page.request.get("/guides/sunil-sochi")).text(), {
        timeout: 20_000,
      })
      .toContain("Сунил");
    const html = await (await page.request.get("/guides/sunil-sochi")).text();
    // The identity is the DISPLAY name, never the email local-part (msg 546/577).
    expect(html).not.toContain("sunil.munilov");
  });
});

// ---------------------------------------------------------------------------
// 4. Homepage: budget is per person
// ---------------------------------------------------------------------------
test("04 homepage budget field says per person", async ({ browser }) => {
  await eachViewport(browser, null, async (page, _vp, shot) => {
    await page.goto("/");
    const budget = page.locator("#budgetPerPersonRub");
    await expect(budget).toBeVisible();
    // The hint lives in the field's own label, so it is also readable at 375px —
    // where a hover tooltip would never appear at all.
    await expect(page.locator('label[for="budgetPerPersonRub"]')).toHaveText(/на человека/);
    await budget.fill("5000");
    await settle(page, budget);
    await shot("04-home-budget-per-person");
  });
});

// ---------------------------------------------------------------------------
// 5 + 12. Homepage: real inventory under «Как это работает»
// ---------------------------------------------------------------------------
test("05 homepage shows inventory blocks under «Как это работает»", async ({ browser }) => {
  await eachViewport(browser, null, async (page, _vp, shot) => {
    await page.goto("/");
    for (const block of [
      "Готовые экскурсии",
      "Популярные направления",
      "Гиды",
      "Отзывы",
      "Вопросы и ответы",
    ]) {
      await expect(page.getByRole("heading", { name: block, exact: true })).toBeVisible();
    }
    // They sit AFTER «Как это работает», which is what the request says.
    const order = await page.evaluate(() => {
      const heads = [...document.querySelectorAll("h2")].map((h) => (h.textContent ?? "").trim());
      return { how: heads.indexOf("Как это работает"), listings: heads.indexOf("Готовые экскурсии") };
    });
    expect(order.how).toBeGreaterThanOrEqual(0);
    expect(order.listings).toBeGreaterThan(order.how);

    const listings = page
      .locator("section", { has: page.getByRole("heading", { name: "Готовые экскурсии" }) })
      .first();
    await settle(page, listings);
    await shot("05-home-inventory-blocks");

    // 12: only MODERATED excursions reach the homepage. The draft and the
    // pending-review fixtures must not leak onto a public page.
    await expect(page.getByRole("link", { name: /Степь и хурул/ })).toBeVisible();
    await expect(page.getByText("Закат на Маныче")).toHaveCount(0);
    await expect(page.getByText("Буддийские места Калмыкии")).toHaveCount(0);
    await shot("12-home-moderated-excursions-only");

    // 5 (reviews half): authors are named people. `exact` matters — the block's own
    // subtitle is «Что говорят путешественники», which a substring match would hit.
    const reviews = page
      .locator("section", { has: page.getByRole("heading", { name: "Отзывы", exact: true }) })
      .first();
    await expect(reviews.getByText("Путешественник", { exact: true })).toHaveCount(0);
    await expect(reviews.getByText("Ирина П.").first()).toBeVisible();
    await settle(page, reviews);
    await shot("05-home-reviews-named-authors");
  });
});

// ---------------------------------------------------------------------------
// 6. Homepage: live destination search
// ---------------------------------------------------------------------------
test("06 destination typeahead filters as you type", async ({ browser }) => {
  await eachViewport(browser, null, async (page, _vp, shot) => {
    await page.goto("/");
    const input = page.locator("#destination");
    await input.click();
    await input.pressSequentially("Эли", { delay: 80 });

    const options = page.getByRole("option");
    await expect(options.filter({ hasText: "Элиста" })).toHaveCount(1);
    // It really filters: Astrakhan and Sochi are not in the "Эли" result set.
    await expect(options.filter({ hasText: "Астрахань" })).toHaveCount(0);
    await expect(options.filter({ hasText: "Сочи" })).toHaveCount(0);
    await settle(page, input);
    await shot("06-home-destination-typeahead");

    // A real combobox, not a native datalist: keyboard selection commits the value.
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(input).toHaveValue("Элиста");
    await shot("06-home-destination-selected");
  });
});

// ---------------------------------------------------------------------------
// 7. Header entry «Готовые экскурсии» + the catalog it opens
// ---------------------------------------------------------------------------
test("07 catalog is reachable from the header next to «Запросы»", async ({ browser }) => {
  await eachViewport(browser, null, async (page, vp, shot) => {
    await page.goto("/");
    if (vp.tag === "mobile") {
      await page.getByRole("button", { name: "Открыть меню" }).click();
      await page.waitForTimeout(500);
    }
    const entry = page.getByRole("link", { name: "Готовые экскурсии" }).first();
    await expect(entry).toBeVisible();
    await shot("07-nav-catalog-entry");

    await entry.click();
    await page.waitForURL("**/listings");
    // A real catalog page, not the /guides redirect the off-flag build serves.
    expect(new URL(page.url()).pathname).toBe("/listings");
    await expect(page.getByRole("link", { name: /Степь и хурул/ })).toBeVisible();
    await settle(page);
    await shot("07-catalog-listings");
  });
});

// ---------------------------------------------------------------------------
// 9. Footer: project / support / rules / social links
// ---------------------------------------------------------------------------
test("09 every footer link resolves", async ({ browser }) => {
  await eachViewport(browser, null, async (page, _vp, shot) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await settle(page, footer);
    await shot("09-footer-links");

    for (const href of [
      "/how-it-works",
      "/trust",
      "/become-a-guide",
      "/for-business",
      "/help",
      "/policies/terms",
      "/policies/offer",
      "/policies/privacy",
      "/policies/cookies",
    ]) {
      await expect(footer.locator(`a[href="${href}"]`).first()).toBeVisible();
      expect((await page.request.get(href)).status(), `${href} must resolve`).toBe(200);
    }
    // Support + social are real destinations, not "#".
    await expect(footer.locator('a[href="https://t.me/provodnik_help"]').first()).toBeVisible();
    await expect(footer.locator('a[href^="mailto:"]').first()).toBeVisible();

    // The symptom was «не активны» — so click one and prove it navigates.
    await footer.locator('a[href="/trust"]').first().click();
    await page.waitForURL("**/trust");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await settle(page);
    await shot("09-footer-link-opens-trust");
  });
});

// ---------------------------------------------------------------------------
// 10. Anonymous request: recap at the gate, draft survives the detour
// ---------------------------------------------------------------------------
test("10 anonymous request shows a recap and keeps the draft", async ({ browser }) => {
  await eachViewport(browser, null, async (page, _vp, shot) => {
    await page.goto("/");
    await fillRequestForm(page, { guests: "4", budget: "7000" });
    await page.getByRole("button", { name: "Найти гида" }).click();

    // Not a bare "Зарегистрируйтесь" wall (the Tripster complaint): the trip they
    // just described is echoed back inside the auth dialog.
    const gate = page.getByRole("dialog").first();
    await expect(gate).toBeVisible({ timeout: 15_000 });
    await expect(gate.getByText("Ваша заявка")).toBeVisible();
    await expect(gate.getByText("Элиста")).toBeVisible();
    await expect(gate.getByText("4", { exact: true })).toBeVisible();
    // formatRub() emits a non-breaking space, so match loosely on the money line.
    await expect(gate.getByText(/₽ на человека/)).toBeVisible();
    await settle(page);
    await shot("10-anon-request-recap");

    // Continuity: the answers survive the signup detour (reload = the cheapest proxy
    // for "left the page and came back"), so nobody retypes their trip.
    await page.reload();
    await expect(page.locator("#destination")).toHaveValue("Элиста", { timeout: 15_000 });
    await expect(page.locator("#groupSize")).toHaveValue("4");
    await expect(page.locator("#budgetPerPersonRub")).toHaveValue("7000");
    await settle(page);
    await shot("10-anon-draft-restored");
  });
});

// ---------------------------------------------------------------------------
// 11. Admin: a guide's listings, drafts and moderation included
// ---------------------------------------------------------------------------
test("11 admin sees every listing of a guide, including drafts", async ({ browser }) => {
  await eachViewport(browser, "admin", async (page, _vp, shot) => {
    await page.goto("/admin/users?role=guide&q=Гиляна");
    await userLink(page, "Гиляна Манджиева").click();
    await page.getByRole("link", { name: /Открыть полную анкету/ }).click();
    await expect(page.getByRole("heading", { name: "Гиляна Манджиева" })).toBeVisible();

    // The complaint: "Гиляна создала экскурсию. Но о ней нет информации."
    // All three of hers must be here — published, on moderation, and draft.
    await expect(page.getByText("Гастротур: калмыцкий чай и борцоги")).toBeVisible();
    await expect(page.getByText("Закат на Маныче")).toBeVisible();
    await expect(page.getByText("Буддийские места Калмыкии")).toBeVisible();
    await settle(page);
    await shot("11-admin-guide-listings");
  });
});

// ---------------------------------------------------------------------------
// 13. Public name standard + admin-editable full name
// ---------------------------------------------------------------------------
test("13 public grid shows names, admin edits the full name", async ({ browser }) => {
  await eachViewport(browser, null, async (page, _vp, shot) => {
    await page.goto("/guides");
    const grid = page.locator("main");
    // msg 546/577: a guide card titled with an email local-part. Never again — the
    // public grid carries display names and nothing address-shaped.
    await expect(grid.getByText("Гиляна")).toBeVisible();
    await expect(grid.getByText(/@/)).toHaveCount(0);
    await expect(grid.getByText(/officekg|nayan\.zadvaev/)).toHaveCount(0);
    await settle(page);
    await shot("13-public-guides-names");
  });

  await eachViewport(browser, "admin", async (page, _vp, shot) => {
    const ORIGINAL = "Гиляна Манджиева";
    const EDITED = "Гиляна Бадмаевна Манджиева";

    await page.goto("/admin/users?role=guide&q=Гиляна");
    await userLink(page, ORIGINAL).click();

    // The admin side holds the full FIO — and can really change it. The save button
    // is disabled until the value differs (a no-op save is refused by design), so the
    // proof has to actually type.
    const fullName = page.locator("#full-name");
    await expect(fullName).toHaveValue(ORIGINAL);
    const save = page.getByRole("button", { name: "Сохранить ФИО" });
    await expect(save).toBeDisabled();

    try {
      await fullName.fill(EDITED);
      await expect(save).toBeEnabled();
      await settle(page, fullName);
      await shot("13-admin-full-name-editable");

      await save.click();
      // Assert PERSISTENCE, by reloading until the stored value changes. Every cheaper
      // signal on this form lies: the success text also exists in the audit journal, and
      // `disabled` is true *during* the in-flight save (`disabled={pending || …}`), so it
      // is satisfied before the write lands. Reload-until-it-sticks cannot be fooled.
      await expect
        .poll(
          async () => {
            await page.reload();
            return page.locator("#full-name").inputValue();
          },
          { timeout: 30_000 },
        )
        .toBe(EDITED);
      await shot("13-admin-full-name-saved");

      // The two-field standard: the private FIO changed, the PUBLIC display name did not.
      const publicPage = await page.context().newPage();
      await publicPage.goto("/guides/gilyana-elista");
      await expect(publicPage.getByRole("heading", { name: "Гиляна", exact: true })).toBeVisible();
      await expect(publicPage.getByText(EDITED)).toHaveCount(0);
      await publicPage.close();
    } finally {
      // This is the one test that writes to the fixture. Restore in `finally` — a failure
      // mid-way must never leave the next test looking at a renamed guide (it did exactly
      // that once, and took two later tests down with it). Idempotent: if the edit never
      // landed there is nothing to undo, and saving a value that already matches is
      // refused by the (correctly) disabled button.
      await page.reload();
      const field = page.locator("#full-name");
      if ((await field.inputValue()) !== ORIGINAL) {
        await field.fill(ORIGINAL);
        const restore = page.getByRole("button", { name: "Сохранить ФИО" });
        await expect(restore).toBeEnabled();
        await restore.click();
        // Same rule as above: only persistence counts as "restored".
        await expect
          .poll(
            async () => {
              await page.reload();
              return page.locator("#full-name").inputValue();
            },
            { timeout: 30_000 },
          )
          .toBe(ORIGINAL);
      }
    }

    // Independently confirm the rollback landed, on a fresh load.
    await page.reload();
    await expect(page.locator("#full-name")).toHaveValue(ORIGINAL, { timeout: 20_000 });
  });
});

// ---------------------------------------------------------------------------
// 14. Moderation wording + one approved status
// ---------------------------------------------------------------------------
test("14 moderation queue is «Экскурсии», not «Объявления»", async ({ browser }) => {
  await eachViewport(browser, "admin", async (page, _vp, shot) => {
    await page.goto("/admin/moderation");
    await expect(page.getByRole("heading", { name: "Очередь модерации" })).toBeVisible();
    // «Объявления» — the label nobody understood — is gone.
    await expect(page.getByRole("tab", { name: /Объявления/ })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: /Экскурсии/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Ответы на отзывы/ })).toBeVisible();
    // The pending fixture is actually in the queue.
    await expect(page.getByText("Закат на Маныче")).toBeVisible();
    await settle(page);
    await shot("14-admin-moderation-tabs");
  });
});

// ---------------------------------------------------------------------------
// 15. Admin action latency — the audit page in particular
// ---------------------------------------------------------------------------
test("15 the audit entry always responds", async ({ browser }) => {
  await eachViewport(browser, "admin", async (page, vp, shot) => {
    await page.goto("/admin/dashboard");
    const audit = page.getByRole("link", { name: "Аудит" }).first();
    await expect(audit).toBeVisible();

    const started = Date.now();
    await audit.click();
    await page.waitForURL("**/admin/audit");
    await expect(page.getByRole("heading").first()).toBeVisible();
    const elapsed = Date.now() - started;
    console.log(`[item 15] /admin/audit interactive @${vp.tag} in ${elapsed}ms`);
    // The report was «иногда не срабатывает» — the assertion is that the click always
    // lands. The dev-server number is logged, not gated: it is not a production timing.
    expect(page.url()).toContain("/admin/audit");
    await settle(page);
    await shot("15-admin-audit-opens");
  });
});

// ---------------------------------------------------------------------------
// 16. Compact request-page hero
// ---------------------------------------------------------------------------
test("16 request page hero is compact", async ({ browser }) => {
  const requestId = process.env.WB_REQUEST_ID;
  test.skip(!requestId, "WB_REQUEST_ID not provided");

  await eachViewport(browser, null, async (page, vp, shot) => {
    await page.goto(`/requests/${requestId}`);
    await expect(page.getByRole("heading", { name: "Элиста" })).toBeVisible();

    const hero = page.locator("main section").first();
    const box = await hero.boundingBox();
    expect(box).not.toBeNull();
    console.log(`[item 16] hero height @${vp.tag} = ${Math.round(box!.height)}px`);

    // Desktop: the compact variant caps the band at 280/320px (was 520/632px) — that
    // is the "очень широкое верхнее поле" the report is about.
    // Mobile: the same hero also carries the trip-details panel inline, so its height
    // is content, not empty space. Bound it, but at the honest number.
    expect(box!.height).toBeLessThan(vp.tag === "desktop" ? 400 : 620);
    // Whatever the height, it must be filled with the trip, not padding.
    await expect(hero.getByText(/ДЕТАЛИ ПОЕЗДКИ/i)).toBeVisible();
    await settle(page);
    await shot("16-request-compact-hero");
  });
});

// ---------------------------------------------------------------------------
// 17. Russian grammatical cases
// ---------------------------------------------------------------------------
test("17 count words are declined correctly", async ({ browser }) => {
  await eachViewport(browser, null, async (page, _vp, shot) => {
    await page.goto("/");
    const destinations = page
      .locator("section", { has: page.getByRole("heading", { name: "Популярные направления" }) })
      .first();
    // Seeded guide counts are 2 / 1 / 1 → «2 гида», «1 гид». Never «2 гидов» / «1 гида».
    await expect(destinations.getByText("2 гида")).toBeVisible();
    await expect(destinations.getByText("1 гид", { exact: true }).first()).toBeVisible();
    await expect(destinations.getByText(/\b1 гида\b|\b2 гидов\b/)).toHaveCount(0);
    await settle(page, destinations);
    await shot("17-declension-destinations");

    // Review counts on the guide cards: «1 отзыв», not «1 отзывов»/«1 отзыва».
    await page.goto("/guides");
    await expect(page.getByText("1 отзыв", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/\b1 отзывов\b|\b1 отзыва\b/)).toHaveCount(0);
    await settle(page);
    await shot("17-declension-guide-cards");
  });
});

// ---------------------------------------------------------------------------
// 18. Phone integrity for guides
// ---------------------------------------------------------------------------
test("18 admin flags a phoneless guide and refuses a phoneless promotion", async ({ browser }) => {
  await eachViewport(browser, "admin", async (page, _vp, shot) => {
    // (a) the phoneless guide is visibly flagged in the list
    await page.goto("/admin/users?role=guide");
    const row = page.getByRole("row", { name: /Гиляна Манджиева/ });
    await expect(row.getByText("нет телефона")).toBeVisible();
    await settle(page);
    await shot("18-admin-no-phone-badge");

    // (b) promoting a phoneless account to guide is refused — the bypass is closed
    await page.goto("/admin/users?q=QA Traveler");
    await userLink(page, "QA Traveler").click();
    await expect(page.getByRole("heading", { name: "QA Traveler" })).toBeVisible();

    await page.getByLabel("Причина (обязательно)").fill("QA: роль гида без телефона");
    await page.locator("#role-select").click();
    await page.getByRole("option", { name: "Гид" }).click();
    await page.getByRole("button", { name: "Сменить роль" }).click();

    await expect(page.getByText(/телефон/i).first()).toBeVisible({ timeout: 10_000 });
    await settle(page);
    await shot("18-admin-phone-required-on-role-change");
  });
});

// ---------------------------------------------------------------------------
// Mobile layout guard for the request form (found while proving item 10)
// ---------------------------------------------------------------------------
test("mobile request form keeps every field usable after a date is picked", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  try {
    await page.goto("/");
    await page.locator("#startDate").click();
    await page.locator("[role=gridcell] button:not([disabled])").last().click();
    await closeOverlays(page);

    // The bug: «Когда» and «Гостей» shared one flex row. Picking a date grew the date
    // column's content («Когда» → «2 августа» + the ≈ toggle) and the guests input
    // collapsed to ZERO width — invisible and untypeable on a phone, in the middle of
    // the primary conversion flow. It reported as a "flaky" Playwright timeout: the
    // fill was waiting, correctly, on a field with no area.
    for (const id of ["#groupSize", "#budgetPerPersonRub"]) {
      const box = await page.locator(id).boundingBox();
      expect(box, `${id} must have a box`).not.toBeNull();
      expect(box!.width, `${id} must stay usable at 375px`).toBeGreaterThan(40);
    }
    await page.locator("#groupSize").fill("4");
    await expect(page.locator("#groupSize")).toHaveValue("4");

    // ...and the card must not solve it by overflowing the phone instead (SHIP_GATE).
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, "no horizontal overflow at 375px").toBeLessThanOrEqual(0);

    await page.screenshot({ path: `${SHOTS}/10-mobile-form-fields-usable-mobile.png` });
  } finally {
    await context.close();
  }
});
