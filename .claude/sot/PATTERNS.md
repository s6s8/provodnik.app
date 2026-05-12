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

