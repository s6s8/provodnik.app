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
