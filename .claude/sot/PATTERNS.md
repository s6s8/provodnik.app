# PATTERNS.md — Codebase Conventions

_Mined from actual code, not invented. 2026-04-06_

---

## Protected Page Pattern (Server Component)

```typescript
// src/app/(protected)/[workspace]/[page]/page.tsx
import type { Metadata } from "next";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";

export const metadata: Metadata = { title: "Русское название страницы" };

export default async function PageName() {
  const auth = await readAuthContextFromServer();
  return <ScreenComponent auth={auth} />;
}
```

## Authenticated Data Fetch (Server Component)

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";

const supabase = await createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) { /* handle unauthenticated */ }

// Then use queries:
import { getUserRequests } from "@/data/supabase/queries";
const { data: requests } = await getUserRequests(supabase, user.id);
```

## Glass Card Pattern

```tsx
<div className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass p-6">
  {/* content */}
</div>
```

## shadcn/ui Card Pattern (preferred for dashboard sections)

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card className="border-border/70 bg-card/90">
  <CardHeader className="space-y-1">
    <CardTitle>Заголовок</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

## Stat Card Pattern (from existing dashboards)

```tsx
<div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4 md:gap-12">
  <div>
    <strong className="block font-sans text-[2.25rem] font-semibold text-foreground">
      {count}
    </strong>
    <span className="text-sm text-muted-foreground">Описание метрики</span>
  </div>
</div>
```

## Page Section Pattern

```tsx
<div className="space-y-8">
  <div className="space-y-3">
    <Badge variant="outline">Кабинет гида</Badge>
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        Заголовок
      </h1>
      <p className="max-w-3xl text-base text-muted-foreground">
        Описание
      </p>
    </div>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button asChild variant="secondary">
        <Link href="/path">Действие</Link>
      </Button>
    </div>
  </div>
</div>
```

## Metadata Export Pattern

```typescript
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Мои запросы" };
// Composites to: "Мои запросы — Provodnik"
```

## NODE_ENV Guard Pattern (dev-only UI)

```tsx
{process.env.NODE_ENV !== 'production' && (
  <div>
    {/* dev-only content */}
  </div>
)}
```

## Supabase Query Function Signature

```typescript
export async function getFoo(
  client: SupabaseClient,  // first arg: authenticated client
  id: string,             // second arg: user/resource ID
): Promise<QueryResult<FooRecord[]>>
```

## File Naming

- Page: `page.tsx` (Next.js App Router convention)
- Screen component: `[feature]-screen.tsx` (e.g., `guide-dashboard-screen.tsx`)
- Shared component: `[name].tsx` in `src/components/shared/`
- Data queries: functions in `src/data/supabase/queries.ts`

## CSS Rules

- Tailwind utilities only — no custom CSS classes
- No inline `style={{}}` for layout
- `globals.css` has ONLY design tokens — never add custom classes
- Glass: `bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass`

## Seed SQL Pattern

```sql
insert into public.some_table (col1, col2, ...) values
  ('uuid', 'value', ...)
on conflict (id) do update set
  col1 = excluded.col1, updated_at = t;
```

Always use `on conflict do update` or `on conflict do nothing` for idempotency.



## E2E Seed Credential Fixture Pattern

All e2e specs import seed user credentials from a single typed constant file. **Never** hardcode email/password strings in spec files.

```typescript
// tests/e2e/fixtures.ts — single source of truth, mirrors supabase/migrations/*_seed_accounts.sql
type SeedUserCredentials = { email: string; password: string };

export const SEED_USERS: {
  admin: SeedUserCredentials;
  traveler: SeedUserCredentials;
  guide: SeedUserCredentials;
} = {
  admin:    { email: "admin@provodnik.test",    password: "Admin1234!"  },
  traveler: { email: "traveler@provodnik.test", password: "Travel1234!" },
  guide:    { email: "guide@provodnik.test",    password: "Guide1234!"  },
};
```

Consumption in specs:

```typescript
import { SEED_USERS } from "../fixtures";

await loginAs(page, SEED_USERS.guide.email, SEED_USERS.guide.password);
await page.fill("#email", SEED_USERS.traveler.email);
```

**Rule:** Any change to the seed migration's credential values has exactly one update target: `tests/e2e/fixtures.ts`. This is how ERR-059 layer 1 (spec/seed identity mismatch) is prevented from recurring.




## Multi-Persona Audit Registry Pattern

Structured observation-only audits use one directory per audit run, one file per persona, a shared LEGEND, and a dedicated `screenshots/` placeholder:

```
audits/<YYYY-MM-DD>-<ticket>/
  LEGEND.md        ← column schema, criticality scale, viewport rules, seed roster, role-switch protocol
  guest.md         ← unauthenticated routes
  traveler.md      ← traveler-protected routes
  guide.md         ← guide-protected routes (+ PRE-GATE row)
  admin.md         ← admin-protected routes
  screenshots/     ← 1280px primary; 375px when responsive reflow observed (.gitkeep until walk)
```

Column order is identical across all persona files:

| route | row_type | steps | expected | actual | screenshot | fact-or-question-for-PM | criticality |

- **row_type** — `UX` | `CONSOLE` | `SERVER-ERROR`
- **criticality** — `P0` (blocker — feature unusable) | `P1` (serious — degrades flow) | `P2` (minor — workaround exists) | `Cosmetic`
- Stub rows before the live walk use `—` in every column except `route` and `row_type`.
- Guide persona always opens with a **PRE-GATE** row: confirm `user_metadata.role` and `app_metadata.role` are both `"guide"` in the stored Supabase session before navigating to any `/guide/*` route. If either is missing or wrong, log a P1 — do not silently fix metadata client-side.
- Primary guide credential for local/seed walkthroughs: `dev+guide@rgx.ge`. `guide@provodnik.test` does **not** exist (ADR-058) — never use it for login attempts.
- Role switch between personas: `window.location.href = '/api/auth/signout'` — never `supabase.auth.signOut()` (ADR-015 / HOT.md).




## Audit Fix-Queue Pattern (RUBRIC.md + QUEUE.md)

After a multi-persona audit registry is complete, produce exactly two artifacts to drive the fix pass:

```
audits/<YYYY-MM-DD>-<ticket>/
  RUBRIC.md   ← four-tier taxonomy: audit criticality × epic position → queue tier
  QUEUE.md    ← ordered queue covering 100% of registry rows + explicit exclusions + validation table
```

### RUBRIC.md structure

| Tier | Name | When to use |
| --- | --- | --- |
| P0 | Blocker | Persona flow impossible; security/money/data loss; audit operability blocked |
| P1 | High | Wrong user-visible data; broken secondary path; inconsistent model (silent data drop) |
| P2 | Medium | Workaround exists; silent error states; stub/reality drift; seeding dependency |
| P3 | Deferred | Cosmetic-only; PASS rows for traceability; epic-explicit backlog (К-tags) |

Pinned К-tags (tech-debt/cosmetic backlog from the epic plan) stay at P3 regardless of audit criticality. Raising them above P3 requires explicit product sign-off and triggers a `CONCERN: cosmetic escalation attempt` annotation in QUEUE.md.

### QUEUE.md structure

- **Preamble** — viewport-coverage matrix (1280px / 375px × all personas) with explicit TODO sentinels for incomplete passes and tooling caveats.
- **Explicit exclusions** — in-flight tickets already sequenced by the epic, listed separately so they don't inflate the orphan count.
- **Ordered queue** — one row per finding or one consolidated row for multi-route P0/P1 clusters. Columns: `Finding-IDs | Criticality | Fact-or-Q-to-Product | Tier | Open-Product-Question | Concern-Annotation`.
- **Validation table** — proves zero orphans: every registry `route` value maps to exactly one queue row or one exclusion entry.

### Coverage invariant

```
Registry rows total == queue rows covered + explicit exclusions
Orphaned registry route values == 0
```

Fail the queue document if orphan count > 0 — a missing row means a finding was silently dropped.

### Relationship to Multi-Persona Audit Registry Pattern

The existing Audit Registry Pattern (Stage 1) produces: `guest.md`, `traveler.md`, `guide.md`, `admin.md`, `LEGEND.md`, `screenshots/`.
The Fix-Queue Pattern (Stage 2 prep) consumes those files and produces: `RUBRIC.md`, `QUEUE.md`.
Together they form the complete two-stage cycle: **Stage 1 → observe/register → Stage 2 prep → prioritize → Stage 2 → fix**.




## Display-Layer Field Masking Pattern

Apply sensitive-field transforms at the outermost render/API boundary, not in the DB query. Keep the data layer raw; mask only for output.

```typescript
// src/lib/pii/mask.ts
/**
 * Visual-only masking: replaces `body` via maskPii;
 * all other fields shallow-copied unchanged.
 */
export function maskMessageBodies<T extends { body: string }>(messages: T[]): T[] {
  return messages.map((m) => ({
    ...m,
    body: maskPii(m.body),
  }));
}
```

Consumption — apply immediately after the DB query, before returning to render or JSON:

```typescript
// Server Component (page.tsx)
const displayMessages = maskMessageBodies(initialMessages);
// pass displayMessages to the client component, NOT initialMessages

// API route (route.ts)
const messages = maskMessageBodies(await getThreadMessages(threadId));
return NextResponse.json(messages, { headers: ... });
```

**Rules:**
- The transform function must be generic over `T extends { body: string }` so TypeScript preserves all other fields.
- Use spread (`...m`) + field override; never reconstruct the object by hand (fields will drift).
- DB layer stays raw — never store the masked value, only output it.
- Every new surface that outputs message rows (new route, new page, admin panel, export) MUST call the masking helper. See HOT.md PII-012.




## Self-Dismissing Inline Status Message Pattern

For demo/stub action components that need transient inline feedback without pulling in a toast library:

```tsx
'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";

type StubActionButtonProps = {
  onClick?: () => void;
};

export function StubActionButton({ onClick: onClickProp }: StubActionButtonProps) {
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!statusMsg) return;
    const t = window.setTimeout(() => setStatusMsg(null), 2400);
    return () => window.clearTimeout(t);
  }, [statusMsg]);

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="outline"
        className="w-fit text-muted-foreground"
        onClick={() => {
          onClickProp?.();
          setStatusMsg("Действие выполнено (имитация)");
        }}
      >
        Выполнить
      </Button>
      {statusMsg ? (
        <p className="text-xs text-muted-foreground" role="status">
          {statusMsg}
        </p>
      ) : null}
    </div>
  );
}
```

**Rules:**
- `role="status"` on the feedback paragraph enables screen-reader announcement without focus movement.
- Always return a cleanup function from `useEffect` to cancel the timer on unmount or when the message changes.
- Use `window.setTimeout` (not bare `setTimeout`) to prevent SSR type errors in strict TypeScript.
- The `onClick` passthrough must be optional (`onClick?: () => void`) and optional-chained (`onClickProp?.()`) so the component is usable both standalone and as a controlled stub.
- **Guard requirement:** Any component of this class that exists for demo/staging purposes MUST be wrapped in `{process.env.NODE_ENV !== 'production' && (...)}` at the call site. See HOT.md — Unguarded demo payment UI landmine and ERR-002.





## Responsive CSS Property Assertion Pattern (Playwright E2E)

Verify that responsive Tailwind utility classes produce correct computed values at specific viewport widths using `element.evaluate` + `getComputedStyle`:

```typescript
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// Ensure screenshot output directory exists before all tests
test.beforeAll(() => {
  mkdirSync(join(process.cwd(), "test-results"), { recursive: true });
});

test("section padding-bottom at 375px", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const section = page.locator('[aria-label="Section name"]');
  await expect(section).toBeVisible();
  const paddingBottom = await section.evaluate(
    (el) => getComputedStyle(el).paddingBottom,
  );
  expect(paddingBottom).toBe("64px"); // pb-16 = 4rem = 64px at default root font size
  await page.screenshot({
    path: join(process.cwd(), "test-results", "my-section-375.png"),
    fullPage: true,
  });
});
```

**Rules:**
- Use `element.evaluate((el) => getComputedStyle(el).cssProperty)` to read computed style values — Playwright's DOM locator API does not expose computed Tailwind class resolution directly.
- Always call `mkdirSync(..., { recursive: true })` in `test.beforeAll` for any screenshot output directory — Playwright does not auto-create parent directories, and the test run will throw on the `page.screenshot` call if the path does not exist.
- Assert the **pixel value** that corresponds to the Tailwind token at the default root font size (1rem = 16px): `pb-16` → `64px`, `pb-24` → `96px`, `pb-14` → `56px`, etc.
- Run one test per breakpoint when a component uses responsive modifiers (`xl:`, `md:`, `lg:`). Canonical viewports: `375×812` (mobile) and `1280×800` (desktop).
- Prefer `aria-label` or `data-testid` selectors for section targeting over structural selectors (`section:nth-child(...)`) which are fragile to layout reordering.
- Spec file lives at `tests/e2e/<feature>-spacing.spec.ts`; screenshots land in `test-results/` (already in `.gitignore`).
- First introduced in `tests/e2e/homepage-spacing.spec.ts` (2026-05-13).



## Canonical Vocabulary Module Pattern

When a domain vocabulary (slugs, labels, icons) is shared across multiple surfaces, extract it into a single `src/data/<domain>.ts` module. Downstream modules derive their data via `.map()` + `satisfies` rather than maintaining parallel inline arrays. Introduced in `src/data/themes.ts` (2026-05-14).

### Canonical module shape

```typescript
// src/data/themes.ts
import type { LucideIcon } from "lucide-react";
import { Landmark, Building2, /* ... */ } from "lucide-react";

// 1. Slug union — the authoritative type for all theme identifiers
export type ThemeSlug =
  | "history"
  | "architecture"
  | "nature"
  | "food"
  | "art"
  | "photo"
  | "kids"
  | "unusual";

// 2. Record type — full shape including UI assets
export type Theme = {
  slug: ThemeSlug;
  label: string;
  Icon: LucideIcon;
};

// 3. Data array — `as const` preserves literal types; `satisfies` enforces the record shape
export const THEMES = [
  { slug: "history", label: "История", Icon: Landmark },
  // ...
] as const satisfies readonly Theme[];

// 4. Typed lookup helper — avoids ad-hoc Array.find at call sites
export function getTheme(slug: string): Theme | undefined {
  return THEMES.find((t) => t.slug === slug);
}
```

### Deriving a downstream constant

```typescript
// src/data/interests.ts
import { THEMES, type ThemeSlug } from "./themes";

// satisfies (not `as const`) keeps the result a plain ReadonlyArray
// while typing `id` as ThemeSlug rather than string
export const INTEREST_CHIPS = THEMES.map(({ slug, label }) => ({
  id: slug,
  label,
})) satisfies ReadonlyArray<{ id: ThemeSlug; label: string }>;
```

### Building an inline label map from the derived constant

```typescript
// Any component that needs a slug → label lookup
import { INTEREST_CHIPS } from "@/data/interests";

const interestLabel: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map(({ id, label }) => [id, label]),
);
// interestLabel["history"] → "История"
```

**Rules:**
- `as const satisfies readonly T[]` on the canonical array: `as const` preserves literal slug types; `satisfies` enforces the record shape without widening to `T[]`.
- Downstream derivations use `.map()` + `satisfies` (not `as const`) so the result is a plain `ReadonlyArray<{...}>` compatible with `string`-keyed lookups.
- The canonical module owns the **slug union type**. Every surface that renders, stores, or filters by theme must import from here — never declare a parallel slug list or inline label map (see HOT.md — Interest-vocabulary drift).
- Inline label maps at call sites must be derived via `Object.fromEntries(INTEREST_CHIPS.map(...))`, typed as `Record<string, string>` to avoid the `as const` key-narrowing issue (see ERR-048).
- A new theme slug is added in **exactly one place**: `THEMES` in the canonical module. `INTEREST_CHIPS` and all derived constants update automatically. DB constraints and migrations must be kept in sync manually.
- Expose a typed lookup helper (`getTheme`) in the canonical module; prefer it over bare `Array.find` at call sites.





## Canonical Vocabulary — Zod Validation & Form Typing

Extension of the Canonical Vocabulary Module Pattern covering how to wire the canonical slug type through the Zod validation layer and React Hook Form `defaultValues`. Introduced when the traveler-request schema was tightened from `z.array(z.string())` to an enum-validated array (2026-05-16).

### Zod enum from canonical vocabulary

`z.enum()` requires a non-empty tuple `[string, ...string[]]`. Cast from the `.map()` result using the slug union type:

```typescript
import { THEMES, type ThemeSlug } from "@/data/themes";

// In a Zod schema object:
interests: z
  .array(
    z.enum(THEMES.map((t) => t.slug) as [ThemeSlug, ...ThemeSlug[]]),
  )
  .min(1, { message: "Выберите хотя бы одну категорию" }),
```

This ensures Zod rejects any ghost slug at validation time (unknown string → enum parse error) without maintaining a separate allow-list.

### Derived query-layer allow-list with `satisfies`

When a query function needs its own slug allow-list (e.g. for input sanitisation before a DB call), derive it with `satisfies` so the type is enforced without widening:

```typescript
// Stays in sync with THEMES automatically; TypeScript enforces the shape
const VALID_INTEREST_SLUGS = THEMES.map((t) => t.slug) satisfies readonly ThemeSlug[];
```

### React Hook Form `defaultValues` typed to schema output

Use the schema's inferred output type for `defaultValues` instead of a wider primitive. This removes every `as string[]` cast from field callbacks (`filter`, `includes`, spread):

```typescript
import type { TravelerRequest } from "@/data/traveler-request/schema";
// z.infer<typeof travelerRequestSchema> produces TravelerRequest

useForm<TravelerRequest>({
  resolver: zodResolver(travelerRequestSchema),
  defaultValues: {
    interests: [] as TravelerRequest["interests"], // ThemeSlug[], not string[]
    // ...
  },
});

// Field callbacks now infer the correct element type — no manual cast needed:
const next = selected
  ? interestsField.value.filter((s) => s !== theme.slug) // s: ThemeSlug
  : [...interestsField.value, theme.slug];
```

**Rule:** The canonical vocabulary module (`src/data/themes.ts`) is the single point of change for any new slug. The Zod enum, query allow-list, and RHF types all derive from it — no slug list is maintained separately anywhere in the stack.





## DB Category → Canonical Slug Mapper Pattern

When a DB column stores legacy display strings (Russian labels, old enum values, pre-migration free text) that need to map to a canonical slug vocabulary, extract the mapping into a dedicated `mapper.ts` file alongside the domain's types. The public function returns `ThemeSlug | null` — never casts unknowns, never throws. Consumers decide the fallback. Introduced in `src/data/public-listings/mapper.ts` (2026-05-16).

### Mapper module shape

```typescript
// src/data/<domain>/mapper.ts
import type { ThemeSlug } from "@/data/themes";

// 1. Canonical slug set — for fast "already-a-slug" pass-through check
//    Keep in sync with THEMES; duplicate rather than import THEMES to
//    avoid pulling Lucide icons into the server query path.
const THEME_SLUGS: readonly ThemeSlug[] = [
  "history", "architecture", "nature", "food",
  "art", "photo", "kids", "unusual",
];

// 2. Legacy display string → canonical slug
//    Multiple legacy strings may map to the same slug.
//    Include BOTH Cyrillic ё/е variants for any word that uses them.
const LEGACY_CATEGORY_TO_SLUG: Record<string, ThemeSlug> = {
  "История": "history",
  "Природа": "nature",
  "Гастрономия": "food",
  "Еда": "food",
  "Фотография": "photo",
  "Фотопрогулки": "photo",
  "С семьей": "kids",    // е variant
  "С семьёй": "kids",   // ё variant — must list both
  "Для детей": "kids",
  "Архитектура": "architecture",
  "Искусство": "art",
  "Необычное": "unusual",
};

// 3. Public mapper — null for unknowns, never throws
export function mapDbCategoryToThemeSlug(raw: string): ThemeSlug | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Pass-through: rows already storing canonical slugs work without a lookup entry
  if ((THEME_SLUGS as readonly string[]).includes(trimmed)) {
    return trimmed as ThemeSlug;
  }
  return LEGACY_CATEGORY_TO_SLUG[trimmed] ?? null;
}
```

### Consumption at the data/row-mapper layer

```typescript
// In a row-mapper (page.tsx or queries.ts):
themes: (() => {
  const slug = mapDbCategoryToThemeSlug(listing.format);
  return slug != null ? ([slug] as const) : [];
})(),
```

**Rules:**
- Return `ThemeSlug | null`, never widen to `string` or cast unknowns. The caller (row-mapper) decides the fallback; `themes: []` is the conventional choice — the listing stays visible under "Все" but is excluded from per-theme filters, making the gap obvious during QA.
- The pass-through check (`THEME_SLUGS.includes`) keeps the mapper forward-compatible: new slugs added to `THEMES` (and mirrored into `THEME_SLUGS`) work without touching `LEGACY_CATEGORY_TO_SLUG`.
- Keep `THEME_SLUGS` and `LEGACY_CATEGORY_TO_SLUG` private; export only the mapper function.
- Cyrillic ё/е: always add both variants (`С семьей` / `С семьёй`) — DB clients, Telegram, and some migration scripts normalize differently.
- When a new DB seed category is introduced, add it to `LEGACY_CATEGORY_TO_SLUG` in the same commit. Missing entries are detectable (listing has `themes: []`) but silent at runtime; add a grep check to code review: `grep -n 'category' supabase/migrations/ | grep -v '#'` should have a matching entry in the mapper.
- New canonical themes are added to `THEMES` in `src/data/themes.ts` only. The `THEME_SLUGS` array in the mapper must be kept in manual sync (deliberate: avoids pulling Lucide icons into query-layer imports).





## Server-Action Ghost-Slug Defense Pattern

When a server action receives a `string[]` of user-supplied vocabulary slugs (from `formData.getAll()`), sanitise them against the canonical vocabulary at the **server action layer** using a module-level `Set<string>` + type-predicate filter. This adds a silent defense-in-depth layer on top of the Zod enum validation that runs at parse time. Introduced in `src/app/(protected)/profile/guide/about/actions.ts` (2026-05-16).

```typescript
import type { ThemeSlug } from "@/data/themes";
import { THEMES } from "@/data/themes";

// Constructed once at module load — O(1) per lookup, never per request
const canonThemeSlugs = new Set<string>(THEMES.map((t) => t.slug));

export async function saveGuideAboutAction(formData: FormData): Promise<SaveResult> {
  const specializationsRaw = formData.getAll("specializations") as string[];

  // Type-predicate filter: strips ghost slugs AND narrows TypeScript type to ThemeSlug[]
  const specializations = specializationsRaw.filter(
    (s): s is ThemeSlug => canonThemeSlugs.has(s)
  );

  await db.from("guide_profiles").update({ specializations }).eq("user_id", userId);
}
```

**Rules:**
- Declare the `Set` at **module scope** (outside the action function) so it is constructed once per module load, not on every request invocation.
- Use a **type predicate** (`(s): s is ThemeSlug => canonThemeSlugs.has(s)`) to simultaneously strip invalid values and narrow the TypeScript type — avoids an `as ThemeSlug[]` cast and keeps the array type honest.
- This pattern **complements** (does not replace) Zod enum validation. Zod runs at parse time and surfaces a validation error to the form; the Set filter is the server-side safety net for values that bypass the form layer (direct `FormData` POST, stale client caches, future API consumers).
- **Never** hardcode the allowed slug list inline — always derive from `THEMES` in `src/data/themes.ts`. See Canonical Vocabulary Module Pattern and HOT.md HOT-UPDATE.
- If the filtered array is empty and the field is required, the action should return `{ ok: false, error: '...' }` rather than writing an empty array to the DB.





## PostgREST ilike Full-Text Search Pattern

When a user-supplied search string reaches a PostgREST `.ilike.` filter, **two separate escaping layers** are required. Missing either layer produces silently wrong results (user input acts as SQL wildcards) or a malformed PostgREST filter string.

### Layer 1 — LIKE wildcard escaping (caller / page layer)

Apply before passing the value to the data layer.

```typescript
// src/app/(site)/guides/page.tsx — exemplar
const trimmedQ = (sp.q ?? "").trim();
const rawQ = trimmedQ.length === 0 ? undefined : trimmedQ;
const cappedForFilter = rawQ ? rawQ.slice(0, 80) : undefined; // hard length cap FIRST
const sanitizedQ = cappedForFilter
  ? cappedForFilter.replace(/%/g, "\\%").replace(/_/g, "\\_")
  : undefined;
```

- **Cap before escaping** — prevents pathologically long DB patterns.
- Escape `%` → `\%` and `_` → `\_` so the user cannot inject LIKE wildcards.

### Layer 2 — PostgREST quoted-filter escaping (data layer)

Apply immediately before interpolating into the filter string.

```typescript
// src/data/supabase/queries.ts
/** `\` + `"` for values inside PostgREST double-quoted filter literals (`.ilike."…"`). */
function escapePostgrestFilterQuotedInner(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// In the query builder:
if (filters?.q) {
  const v = escapePostgrestFilterQuotedInner(filters.q);
  query = query.or(`display_name.ilike."%${v}%",bio.ilike."%${v}%"`);
}
```

- PostgREST double-quoted filter values treat `\` and `"` as special characters; both must be escaped.
- Apply **after** Layer 1 so the `\%` / `\_` sequences are preserved through the PostgREST parser — not re-interpreted as literal characters.

**Rules:**
- Keep the two escaping steps in separate, named functions — never collapse them into one anonymous substitution chain.
- The data-layer helper (Layer 2) must receive an already-wildcard-escaped string from the caller, not the raw user input.
- Always impose a character cap (e.g. 80) **before** escaping to bound query cost.
- Applies to any `.ilike.` or `.like.` filter added in `src/data/supabase/queries.ts`. Single-column filters follow the same two-layer rule as multi-column `.or(...)` strings.
- First introduced in `src/data/supabase/queries.ts` + `src/app/(site)/guides/page.tsx` (guide search, 2026-05-16).

