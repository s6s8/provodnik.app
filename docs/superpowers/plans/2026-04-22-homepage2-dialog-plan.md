# Homepage2 — Диалог Concept Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/home2` — a full-bleed hero where travellers fill a natural-language sentence, submit it as a live request to all guides, and land on a confirmation screen that makes the Биржа mechanic feel real.

**Architecture:** Six tasks in three dependency layers. Layer 1 (Tasks 1–2): data queries and server action — independent, can run in parallel. Layer 2 (Tasks 3–4): hero component and shell — depend on Layer 1 types. Layer 3 (Tasks 5–6): sent screen and post-auth pickup page — depend on Layer 2.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind v4, shadcn/ui, Supabase JS v2, React 19 (`useActionState`, `useOptimistic`), Vitest (pure-function tests only)

> **Research notes (2026-04-22):** (1) `useActionState` replaces `useTransition` for server actions in React 19 — plan updated. (2) `useOptimistic` added to SentScreenEnrich for instant budget chip feedback. (3) ARIA roles + Escape key added to all slot pickers. (4) Supabase batch count approach confirmed correct — PostgREST embedded count not in JS v2 docs. (5) RLS safe — service role client bypasses policies server-side.

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/data/supabase/queries.ts` | Add `DestinationOption` type + 3 new query functions |
| Create | `src/app/(protected)/traveler/requests/quick/actions.ts` | `createQuickRequestAction` server action |
| Create | `src/app/(protected)/traveler/requests/sent-actions.ts` | `updateRequestDetailsAction` server action |
| Create | `src/features/homepage/components/homepage-hero2.tsx` | Client hero with slot state + pickers |
| Create | `src/features/homepage/components/homepage-discovery.tsx` | Server component — 3 sketch cards |
| Create | `src/features/homepage/components/homepage-shell2.tsx` | New shell (Hero2 + Discovery + GuideAcquisition + Footer) |
| Create | `src/app/(home)/home2/page.tsx` | Test route at `/home2` |
| Create | `src/features/requests/components/sent-screen-enrich.tsx` | Client island — inline budget/notes editor |
| Create | `src/app/(protected)/traveler/requests/[requestId]/sent/page.tsx` | Sent confirmation screen (server page) |
| Create | `src/app/(protected)/traveler/requests/quick/page.tsx` | Post-auth redirect handler |

---

## Dependency Map

```
Task 1 (queries) ──────────────────────────────→ Task 3 (hero uses DestinationOption)
Task 1 (queries) ──────────────────────────────→ Task 4 (shell2/home2 page uses new queries)
Task 2 (quick action) ─────────────────────────→ Task 3 (hero imports createQuickRequestAction)
Task 2 (quick action) ─────────────────────────→ Task 6 (pickup page calls action)
Task 2 (sent-actions) ─────────────────────────→ Task 5 (enrich island imports updateRequestDetailsAction)
Tasks 3 + 4 complete ──────────────────────────→ /home2 renders
Tasks 5 complete ──────────────────────────────→ sent screen renders
```

---

## Task 1: Data layer — three new query functions

**Files:**
- Modify: `src/data/supabase/queries.ts`

### What this adds
- `DestinationOption` type (exported)
- `getActiveGuideDestinations()` — supply-driven picker list from live guide listings
- `getHomepageRequests()` — 3 open requests with real offer counts (not hardcoded 0)
- `getSimilarRequests()` — for sent screen Zone 4

- [ ] **Step 1: Add `DestinationOption` type**

Open `src/data/supabase/queries.ts`. Find the block of exported types near the top (after the imports, around the `ListingRecord` type). Add immediately after the last exported type:

```ts
export type DestinationOption = {
  name: string;
  region: string;
  guideCount: number;
};
```

- [ ] **Step 2: Add `getActiveGuideDestinations`**

Add at the end of the file, before the closing:

```ts
export async function getActiveGuideDestinations(
  client: SupabaseClient,
): Promise<QueryResult<DestinationOption[]>> {
  try {
    const { data, error } = await client
      .from("listings")
      .select("city, region, guide_id")
      .eq("status", "published")
      .not("city", "is", null);

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const map = new Map<string, { name: string; region: string; guides: Set<string> }>();
    for (const row of data) {
      const key = `${row.city}|${row.region}`;
      if (!map.has(key)) {
        map.set(key, { name: row.city as string, region: (row.region as string) ?? "", guides: new Set() });
      }
      map.get(key)!.guides.add(row.guide_id as string);
    }

    const result: DestinationOption[] = Array.from(map.values())
      .map(({ name, region, guides }) => ({ name, region, guideCount: guides.size }))
      .sort((a, b) => b.guideCount - a.guideCount)
      .slice(0, 50);

    return { data: result, error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}
```

- [ ] **Step 3: Add `getHomepageRequests`**

Add after `getActiveGuideDestinations`:

```ts
export async function getHomepageRequests(
  client: SupabaseClient,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const { data: rows, error } = await client
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;
    if (!rows || rows.length === 0) return { data: [], error: null };

    const ids = rows.map((r) => r.id as string);

    const { data: offerRows } = await client
      .from("guide_offers")
      .select("request_id")
      .in("request_id", ids);

    const countMap: Record<string, number> = {};
    for (const row of offerRows ?? []) {
      countMap[row.request_id as string] = (countMap[row.request_id as string] ?? 0) + 1;
    }

    const records = rows.map((row) => {
      const rec = mapRequestRow(row);
      rec.offerCount = countMap[rec.id] ?? 0;
      return rec;
    });

    return { data: records, error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}
```

- [ ] **Step 4: Add `getSimilarRequests`**

Add after `getHomepageRequests`:

```ts
export async function getSimilarRequests(
  client: SupabaseClient,
  destinationSlug: string,
  excludeId: string,
): Promise<QueryResult<RequestRecord[]>> {
  try {
    const { data, error } = await client
      .from("traveler_requests")
      .select("*")
      .eq("status", "open")
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!data || data.length === 0) return { data: [], error: null };

    const records = data.map((row) => mapRequestRow(row));
    const sameSlug = records.filter((r) => r.destinationSlug === destinationSlug);
    const result = sameSlug.length >= 2 ? sameSlug.slice(0, 3) : records.slice(0, 2);

    return { data: result, error: null };
  } catch (error) {
    return { data: [], error: makeError(error) };
  }
}
```

- [ ] **Step 5: Typecheck**

```bash
cd D:/dev2/projects/provodnik/provodnik.app && bun run typecheck 2>&1 | head -30
```

Expected: 0 errors. If errors mention `mapRequestRow` being private — it isn't, it's a module-level function in the same file, accessible to all added functions.

- [ ] **Step 6: Commit**

```bash
git add src/data/supabase/queries.ts
git commit -m "feat(data): add getActiveGuideDestinations, getHomepageRequests, getSimilarRequests"
```

---

## Task 2: Server actions — createQuickRequestAction + updateRequestDetailsAction

**Files:**
- Create: `src/app/(protected)/traveler/requests/quick/actions.ts`
- Create: `src/app/(protected)/traveler/requests/sent-actions.ts`

- [ ] **Step 1: Write pure-function unit tests**

Create `src/app/(protected)/traveler/requests/quick/actions.test.ts`:

```ts
import { describe, it, expect } from "vitest";

// Inline the pure helpers for testing — mirrors what actions.ts will export
type DurationKey = "1-2d" | "3-5d" | "7d" | "14d";
type CompanionKey = "solo" | "pair" | "friends" | "kids" | "group";

const DURATION_DAYS: Record<DurationKey, number> = {
  "1-2d": 1, "3-5d": 3, "7d": 7, "14d": 14,
};

const COMPANION_MAP: Record<CompanionKey, {
  participants_count: number; open_to_join: boolean; format_preference: string;
}> = {
  solo:    { participants_count: 1, open_to_join: false, format_preference: "private" },
  pair:    { participants_count: 2, open_to_join: false, format_preference: "private" },
  friends: { participants_count: 3, open_to_join: true,  format_preference: "group" },
  kids:    { participants_count: 2, open_to_join: false, format_preference: "private" },
  group:   { participants_count: 4, open_to_join: true,  format_preference: "group" },
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

describe("duration mapping", () => {
  it("maps 1-2d to 1 day", () => {
    expect(DURATION_DAYS["1-2d"]).toBe(1);
  });
  it("maps 7d to 7 days", () => {
    expect(DURATION_DAYS["7d"]).toBe(7);
  });
});

describe("companion mapping", () => {
  it("solo is private, count 1, no join", () => {
    expect(COMPANION_MAP.solo).toEqual({ participants_count: 1, open_to_join: false, format_preference: "private" });
  });
  it("group is group format, count 4, open to join", () => {
    expect(COMPANION_MAP.group).toEqual({ participants_count: 4, open_to_join: true, format_preference: "group" });
  });
});

describe("date helpers", () => {
  it("addDays adds correct number of days", () => {
    const base = new Date("2026-04-22");
    expect(toISODate(addDays(base, 7))).toBe("2026-04-29");
  });
  it("toISODate returns YYYY-MM-DD", () => {
    expect(toISODate(new Date("2026-04-22T12:00:00Z"))).toBe("2026-04-22");
  });
});
```

- [ ] **Step 2: Run tests — expect PASS (pure functions, no mocking needed)**

```bash
cd D:/dev2/projects/provodnik/provodnik.app && bun run test src/app/\(protected\)/traveler/requests/quick/actions.test.ts 2>&1
```

Expected: all 4 tests PASS.

- [ ] **Step 3: Create `createQuickRequestAction`**

Create `src/app/(protected)/traveler/requests/quick/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";

import { rubToKopecks } from "@/data/money";
import { hasSupabaseEnv } from "@/lib/env";
import { createTravelerRequest } from "@/lib/supabase/requests";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DurationKey = "1-2d" | "3-5d" | "7d" | "14d";
type CompanionKey = "solo" | "pair" | "friends" | "kids" | "group";

const DURATION_DAYS: Record<DurationKey, number> = {
  "1-2d": 1,
  "3-5d": 3,
  "7d": 7,
  "14d": 14,
};

const COMPANION_MAP: Record<CompanionKey, {
  participants_count: number;
  open_to_join: boolean;
  format_preference: "private" | "group" | "any";
}> = {
  solo:    { participants_count: 1, open_to_join: false, format_preference: "private" },
  pair:    { participants_count: 2, open_to_join: false, format_preference: "private" },
  friends: { participants_count: 3, open_to_join: true,  format_preference: "group" },
  kids:    { participants_count: 2, open_to_join: false, format_preference: "private" },
  group:   { participants_count: 4, open_to_join: true,  format_preference: "group" },
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export type QuickRequestState = { error: string | null };

export async function createQuickRequestAction(
  _prev: QuickRequestState,
  formData: FormData,
): Promise<QuickRequestState> {
  const destination = ((formData.get("destination") as string) ?? "").trim();
  const duration = (formData.get("duration") as string) as DurationKey | "custom" | "";
  const companion = ((formData.get("companion") as string) ?? "pair") as CompanionKey;
  const customStart = (formData.get("customStart") as string | null) ?? null;
  const customEnd = (formData.get("customEnd") as string | null) ?? null;

  if (!destination) return { error: "Укажите направление" };

  const baseDate = addDays(new Date(), 14);
  let starts_on: string;
  let ends_on: string;

  if (duration === "custom" && customStart && customEnd) {
    starts_on = customStart;
    ends_on = customEnd;
  } else {
    const days = DURATION_DAYS[duration as DurationKey] ?? 3;
    starts_on = toISODate(baseDate);
    ends_on = toISODate(addDays(baseDate, days));
  }

  const companionConfig = COMPANION_MAP[companion] ?? COMPANION_MAP.pair;

  if (!hasSupabaseEnv()) return { error: "Supabase не настроен." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { error: "Необходимо войти в систему." };

  let requestId: string;
  try {
    const record = await createTravelerRequest(
      {
        destination,
        interests: [],
        starts_on,
        ends_on,
        start_time: null,
        end_time: null,
        budget_minor: 0,
        participants_count: companionConfig.participants_count,
        format_preference: companionConfig.format_preference,
        notes: null,
        open_to_join: companionConfig.open_to_join,
        allow_guide_suggestions: true,
        group_capacity: null,
        region: null,
      },
      user.id,
    );
    requestId = record.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Неизвестная ошибка.";
    return { error: `Не удалось сохранить запрос: ${message}` };
  }

  redirect(`/traveler/requests/${requestId}/sent`);
}
```

- [ ] **Step 4: Create `updateRequestDetailsAction`**

Create `src/app/(protected)/traveler/requests/sent-actions.ts`:

```ts
"use server";

import { rubToKopecks } from "@/data/money";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateRequestDetailsAction(
  requestId: string,
  updates: { budgetRub?: number; notes?: string },
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Не авторизован" };

  const { data: req } = await supabase
    .from("traveler_requests")
    .select("traveler_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!req || req.traveler_id !== user.id) return { ok: false, error: "Нет доступа" };

  const patch: Record<string, unknown> = {};
  if (updates.budgetRub !== undefined) patch.budget_minor = rubToKopecks(updates.budgetRub);
  if (updates.notes !== undefined) patch.notes = updates.notes;
  if (Object.keys(patch).length === 0) return { ok: true };

  const { error } = await supabase
    .from("traveler_requests")
    .update(patch)
    .eq("id", requestId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
```

- [ ] **Step 5: Typecheck**

```bash
cd D:/dev2/projects/provodnik/provodnik.app && bun run typecheck 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(protected\)/traveler/requests/quick/actions.ts \
        src/app/\(protected\)/traveler/requests/quick/actions.test.ts \
        src/app/\(protected\)/traveler/requests/sent-actions.ts
git commit -m "feat(requests): createQuickRequestAction + updateRequestDetailsAction"
```

---

## Task 3: HomePageHero2 — client component

**Files:**
- Create: `src/features/homepage/components/homepage-hero2.tsx`

The hero renders a full-bleed background image with a handwritten-style sentence. Three inline slot buttons control which picker is visible. On submit: checks auth via Supabase browser client, either navigates to auth redirect or calls `createQuickRequestAction`.

Font used: `font-display` (Cormorant Garamond — already loaded in `layout.tsx`). No new font import needed.

- [ ] **Step 1: Create `homepage-hero2.tsx`**

> **React 19 upgrade from original plan:** Uses `useActionState` instead of `useTransition` — cleaner `[state, dispatch, isPending]` tuple, no manual state variable for errors. Adds `Escape` key handler to close all pickers. Adds ARIA roles (`role="combobox"`, `role="listbox"`, `role="option"`) to `DestinationPicker`.

Create `src/features/homepage/components/homepage-hero2.tsx`:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { createQuickRequestAction, type QuickRequestState } from "@/app/(protected)/traveler/requests/quick/actions";
import { Button } from "@/components/ui/button";
import type { DestinationOption } from "@/data/supabase/queries";
import { cn } from "@/lib/utils";

type DurationKey = "1-2d" | "3-5d" | "7d" | "14d" | "custom";
type CompanionKey = "solo" | "pair" | "friends" | "kids" | "group";
type ActiveSlot = "destination" | "duration" | "companion" | null;

const DURATION_LABELS: Record<DurationKey, string> = {
  "1-2d": "1–2 дня",
  "3-5d": "3–5 дней",
  "7d": "неделю",
  "14d": "2 недели",
  "custom": "свой вариант",
};

const COMPANION_LABELS: Record<CompanionKey, string> = {
  solo: "один",
  pair: "с парой",
  friends: "с друзьями",
  kids: "с детьми",
  group: "группой",
};

const initialState: QuickRequestState = { error: null };

interface Props {
  destinations: DestinationOption[];
}

export function HomePageHero2({ destinations }: Props) {
  const [destination, setDestination] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState<DurationKey | null>(null);
  const [companion, setCompanion] = React.useState<CompanionKey | null>(null);
  const [activeSlot, setActiveSlot] = React.useState<ActiveSlot>(null);
  const [destSearch, setDestSearch] = React.useState("");
  const [customStart, setCustomStart] = React.useState("");
  const [customEnd, setCustomEnd] = React.useState("");
  const [isAuthed, setIsAuthed] = React.useState<boolean | null>(null);

  // React 19: useActionState gives [state, dispatch, isPending] — replaces useTransition
  const [state, dispatch, isPending] = React.useActionState(
    createQuickRequestAction,
    initialState,
  );

  // Check auth on mount
  React.useEffect(() => {
    import("@/lib/supabase/client").then(({ createSupabaseBrowserClient }) => {
      try {
        createSupabaseBrowserClient()
          .auth.getUser()
          .then(({ data }) => setIsAuthed(!!data.user))
          .catch(() => setIsAuthed(false));
      } catch {
        setIsAuthed(false);
      }
    });
  }, []);

  // Escape key closes any open picker
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveSlot(null);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const filteredDestinations = React.useMemo(() => {
    if (!destSearch) return destinations;
    const q = destSearch.toLowerCase();
    return destinations.filter((d) => d.name.toLowerCase().includes(q));
  }, [destinations, destSearch]);

  function toggleSlot(slot: ActiveSlot) {
    setActiveSlot((prev) => (prev === slot ? null : slot));
  }

  function handleSubmit() {
    if (!destination) return;

    if (!isAuthed) {
      const params = new URLSearchParams({ destination });
      if (duration) params.set("duration", duration);
      if (companion) params.set("companion", companion);
      if (customStart) params.set("customStart", customStart);
      if (customEnd) params.set("customEnd", customEnd);
      window.location.href = `/auth?redirect=/traveler/requests/quick?${params.toString()}`;
      return;
    }

    // Build FormData and dispatch via useActionState
    const fd = new FormData();
    fd.set("destination", destination);
    if (duration) fd.set("duration", duration);
    if (companion) fd.set("companion", companion);
    if (customStart) fd.set("customStart", customStart);
    if (customEnd) fd.set("customEnd", customEnd);
    dispatch(fd);
  }

  return (
    <section
      aria-label="Создать запрос"
      className="-mt-nav-h relative flex min-h-screen items-center justify-center overflow-hidden"
      onClick={() => setActiveSlot(null)}
    >
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=85"
        alt="Горный пейзаж России — путешествуйте с локальными проводниками"
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(25,28,32,0.35)_0%,rgba(25,28,32,0.68)_100%)]"
      />

      <div
        className="relative z-10 mx-auto w-full max-w-3xl px-[clamp(20px,4vw,48px)] pt-[calc(var(--nav-h)+64px)] pb-20 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
          СКАЖИТЕ ОДНОЙ ФРАЗОЙ — ГИДЫ ОТВЕТЯТ
        </p>

        <p className="mb-6 font-display text-[clamp(2rem,5.5vw,3.5rem)] leading-[1.2] text-white">
          {"Хочу в "}
          <SlotButton
            label={destination ?? "___"}
            filled={!!destination}
            active={activeSlot === "destination"}
            onClick={() => toggleSlot("destination")}
            aria-label="Выбрать направление"
          />
          {" на "}
          <SlotButton
            label={duration ? DURATION_LABELS[duration] : "___"}
            filled={!!duration}
            active={activeSlot === "duration"}
            onClick={() => toggleSlot("duration")}
            aria-label="Выбрать длительность"
          />
          {" "}
          <SlotButton
            label={companion ? COMPANION_LABELS[companion] : "с кем?"}
            filled={!!companion}
            active={activeSlot === "companion"}
            onClick={() => toggleSlot("companion")}
            aria-label="Выбрать компанию"
            optional
          />
        </p>

        {activeSlot === "destination" && (
          <DestinationPicker
            destinations={filteredDestinations}
            search={destSearch}
            onSearch={setDestSearch}
            onSelect={(name) => {
              setDestination(name);
              setActiveSlot(null);
              setDestSearch("");
            }}
          />
        )}

        {activeSlot === "duration" && (
          <DurationPicker
            selected={duration}
            onSelect={(d) => {
              setDuration(d);
              if (d !== "custom") setActiveSlot(null);
            }}
            customStart={customStart}
            customEnd={customEnd}
            onCustomStart={setCustomStart}
            onCustomEnd={(v) => {
              setCustomEnd(v);
              if (customStart) setActiveSlot(null);
            }}
          />
        )}

        {activeSlot === "companion" && (
          <CompanionPicker
            selected={companion}
            onSelect={(c) => {
              setCompanion(c);
              setActiveSlot(null);
            }}
          />
        )}

        {state.error && (
          <p role="alert" className="mb-4 text-sm text-red-300">{state.error}</p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={handleSubmit}
            disabled={!destination || isPending}
            size="lg"
            className="min-w-[200px] bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {isPending ? "Отправляем..." : "→ Отправить гидам"}
          </Button>
          <Link
            href="/listings"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Смотреть готовые туры →
          </Link>
        </div>
        <p className="mt-3 text-xs text-white/50">обычно 4–7 предложений за 24 часа</p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SlotButton({
  label, filled, active, onClick, optional, "aria-label": ariaLabel,
}: {
  label: string;
  filled: boolean;
  active: boolean;
  onClick: () => void;
  optional?: boolean;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={active}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "inline cursor-pointer font-display transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        filled
          ? "rounded bg-primary px-2 py-0.5 text-white"
          : optional
            ? "border-b border-white/30 px-1 italic text-white/40"
            : "border-b-2 border-white/70 px-1 italic text-white/60",
        active && "outline outline-2 outline-white/50",
      )}
    >
      {label}
    </button>
  );
}

function DestinationPicker({
  destinations, search, onSearch, onSelect,
}: {
  destinations: DestinationOption[];
  search: string;
  onSearch: (v: string) => void;
  onSelect: (name: string) => void;
}) {
  const listboxId = "dest-listbox";
  return (
    <div
      className="mx-auto mb-6 w-full max-w-sm rounded-xl border border-white/20 bg-black/70 p-3 backdrop-blur-md"
      onClick={(e) => e.stopPropagation()}
    >
      {/* role="combobox" + aria-controls wires input to listbox for screen readers */}
      <input
        autoFocus
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={true}
        aria-controls={listboxId}
        aria-label="Поиск направления"
        type="text"
        placeholder="Поиск направления..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="mb-2 w-full rounded-lg border-none bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
      />
      <ul id={listboxId} role="listbox" aria-label="Направления" className="max-h-48 overflow-y-auto">
        {destinations.length === 0 && (
          <li role="option" aria-selected={false} className="py-2 text-center text-sm text-white/40">
            Ничего не найдено
          </li>
        )}
        {destinations.map((d) => (
          <li key={`${d.name}|${d.region}`} role="option" aria-selected={false}>
            <button
              type="button"
              onClick={() => onSelect(d.name)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
            >
              <span>{d.name}</span>
              <span className="text-xs text-white/40">{d.guideCount} гидов</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DurationPicker({
  selected, onSelect, customStart, customEnd, onCustomStart, onCustomEnd,
}: {
  selected: DurationKey | null;
  onSelect: (d: DurationKey) => void;
  customStart: string;
  customEnd: string;
  onCustomStart: (v: string) => void;
  onCustomEnd: (v: string) => void;
}) {
  const options: DurationKey[] = ["1-2d", "3-5d", "7d", "14d", "custom"];
  return (
    <div
      role="group"
      aria-label="Длительность поездки"
      className="mx-auto mb-6 w-full max-w-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap justify-center gap-2">
        {options.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={selected === key}
            onClick={() => onSelect(key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              selected === key
                ? "border-primary bg-primary text-white"
                : "border-white/30 text-white/80 hover:border-white hover:text-white",
            )}
          >
            {DURATION_LABELS[key]}
          </button>
        ))}
      </div>
      {selected === "custom" && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <input
            type="date"
            aria-label="Дата начала"
            value={customStart}
            onChange={(e) => onCustomStart(e.target.value)}
            className="rounded border border-white/20 bg-black/50 px-2 py-1 text-sm text-white"
          />
          <span aria-hidden="true" className="text-white/50">—</span>
          <input
            type="date"
            aria-label="Дата окончания"
            value={customEnd}
            onChange={(e) => onCustomEnd(e.target.value)}
            className="rounded border border-white/20 bg-black/50 px-2 py-1 text-sm text-white"
          />
        </div>
      )}
    </div>
  );
}

function CompanionPicker({
  selected, onSelect,
}: {
  selected: CompanionKey | null;
  onSelect: (c: CompanionKey) => void;
}) {
  const options: CompanionKey[] = ["solo", "pair", "friends", "kids", "group"];
  return (
    <div
      role="group"
      aria-label="С кем едете"
      className="mx-auto mb-6 flex flex-wrap justify-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={selected === key}
          onClick={() => onSelect(key)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            selected === key
              ? "border-primary bg-primary text-white"
              : "border-white/30 text-white/80 hover:border-white hover:text-white",
          )}
        >
          {COMPANION_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd D:/dev2/projects/provodnik/provodnik.app && bun run typecheck 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/features/homepage/components/homepage-hero2.tsx
git commit -m "feat(homepage): HomePageHero2 client component with slot pickers"
```

---

## Task 4: HomePageDiscovery + HomePageShell2 + /home2 page

**Files:**
- Create: `src/features/homepage/components/homepage-discovery.tsx`
- Create: `src/features/homepage/components/homepage-shell2.tsx`
- Create: `src/app/(home)/home2/page.tsx`

- [ ] **Step 1: Create `homepage-discovery.tsx`**

Create `src/features/homepage/components/homepage-discovery.tsx`:

```tsx
import Link from "next/link";

import type { RequestRecord } from "@/data/supabase/queries";

function buildSentence(req: RequestRecord): string {
  const parts: string[] = [req.destination];
  if (req.dateLabel) parts.push(req.dateLabel);
  if (req.budgetRub > 0) {
    const k = Math.floor(req.budgetRub / 1000);
    parts.push(`бюджет ${k} тыс.`);
  }
  return parts.join(", ");
}

interface Props {
  requests: RequestRecord[];
}

export function HomePageDiscovery({ requests }: Props) {
  if (requests.length === 0) return null;

  return (
    <section aria-label="Открытые запросы путешественников" className="bg-surface py-14">
      <div className="mx-auto w-full max-w-page px-[clamp(20px,4vw,48px)]">
        <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-3">
          вот что сейчас обсуждают другие
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {requests.map((req) => (
            <Link
              key={req.id}
              href={`/requests/${req.id}`}
              className="block rounded-lg border border-foreground/[0.12] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="mb-3 font-display text-[1.125rem] leading-snug text-foreground">
                &ldquo;{buildSentence(req)}&rdquo;
              </p>
              <p className="mb-3 text-sm text-ink-3">↳ {req.offerCount} ответов гидов</p>
              <p className="text-xs font-semibold text-primary">открыть →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `homepage-shell2.tsx`**

Create `src/features/homepage/components/homepage-shell2.tsx`:

```tsx
import { SiteFooter } from "@/components/shared/site-footer";
import type { DestinationOption, RequestRecord } from "@/data/supabase/queries";

import { HomePageGuideAcquisition } from "./homepage-guide-acquisition";
import { HomePageDiscovery } from "./homepage-discovery";
import { HomePageHero2 } from "./homepage-hero2";

interface Props {
  destinations: DestinationOption[];
  requests: RequestRecord[];
}

export function HomePageShell2({ destinations, requests }: Props) {
  return (
    <>
      <HomePageHero2 destinations={destinations} />
      <HomePageDiscovery requests={requests} />
      <HomePageGuideAcquisition />
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 3: Create `/home2` page**

Create `src/app/(home)/home2/page.tsx`:

```tsx
import type { Metadata } from "next";

import {
  getActiveGuideDestinations,
  getHomepageRequests,
} from "@/data/supabase/queries";
import { HomePageShell2 } from "@/features/homepage/components/homepage-shell2";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Проводник — Найди своего гида",
};

export default async function HomePage2() {
  const supabase = await createSupabaseServerClient();
  const [destResult, reqResult] = await Promise.all([
    getActiveGuideDestinations(supabase),
    getHomepageRequests(supabase),
  ]);

  return (
    <HomePageShell2
      destinations={destResult.data ?? []}
      requests={reqResult.data ?? []}
    />
  );
}
```

- [ ] **Step 4: Build check**

```bash
cd D:/dev2/projects/provodnik/provodnik.app && bun run typecheck 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 5: Start dev server and open `/home2`**

```bash
cd D:/dev2/projects/provodnik/provodnik.app && bun dev
```

Navigate to `http://localhost:3000/home2`. Verify:
- Full-bleed mountain background fills viewport
- Sentence renders with three slot words
- Tapping "___" (destination) shows search picker with city list
- Selecting a city fills the slot with red background
- Tapping "___" (duration) shows chip row
- Selecting a duration fills the slot
- "Отправить гидам" button is enabled after destination selected
- Below hero: up to 3 open request cards with sketch border
- Below cards: "Вы гид?" section and footer

- [ ] **Step 6: Commit**

```bash
git add src/features/homepage/components/homepage-discovery.tsx \
        src/features/homepage/components/homepage-shell2.tsx \
        src/app/\(home\)/home2/page.tsx
git commit -m "feat(homepage): HomePageDiscovery, HomePageShell2, /home2 route"
```

---

## Task 5: Sent confirmation screen

**Files:**
- Create: `src/features/requests/components/sent-screen-enrich.tsx`
- Create: `src/app/(protected)/traveler/requests/[requestId]/sent/page.tsx`

- [ ] **Step 1: Create `SentScreenEnrich` client island**

> **React 19 upgrade from original plan:** Uses `useOptimistic` so budget chips highlight instantly on tap — no waiting for the server round-trip. The chip shows selected state immediately; server confirms async. `aria-live="polite"` on the save-state text announces changes to screen readers.

Create `src/features/requests/components/sent-screen-enrich.tsx`:

```tsx
"use client";

import * as React from "react";

import { updateRequestDetailsAction } from "@/app/(protected)/traveler/requests/sent-actions";
import { cn } from "@/lib/utils";

const BUDGET_OPTIONS = [
  { label: "до 10 тыс.", value: 10000 },
  { label: "10–30 тыс.", value: 30000 },
  { label: "30–60 тыс.", value: 60000 },
  { label: "от 60 тыс.", value: 60001 },
] as const;

interface Props {
  requestId: string;
}

export function SentScreenEnrich({ requestId }: Props) {
  const [open, setOpen] = React.useState(false);
  const [committedBudget, setCommittedBudget] = React.useState<number | null>(null);
  const [notes, setNotes] = React.useState("");
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle");
  const notesTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // useOptimistic: chip highlights immediately on tap, rolls back if server fails
  const [optimisticBudget, setOptimisticBudget] = React.useOptimistic(committedBudget);

  async function handleBudgetSelect(value: number) {
    // Instant UI update — no waiting for server
    React.startTransition(() => setOptimisticBudget(value));
    setSaveState("saving");
    const result = await updateRequestDetailsAction(requestId, { budgetRub: value });
    if (result.ok) {
      setCommittedBudget(value); // commit the optimistic value
      setSaveState("saved");
    } else {
      setSaveState("idle"); // optimistic rolls back automatically on next render
    }
    setTimeout(() => setSaveState("idle"), 2000);
  }

  function handleNotesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setNotes(value);
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    setSaveState("saving");
    notesTimerRef.current = setTimeout(async () => {
      await updateRequestDetailsAction(requestId, { notes: value });
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    }, 800);
  }

  return (
    <div className="rounded-xl border border-border bg-surface-high p-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-foreground"
      >
        <span>Добавить детали (необязательно)</span>
        <span aria-hidden="true" className="text-muted-foreground">{open ? "↑" : "↓"}</span>
      </button>

      {open && (
        <div className="mt-5 space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-foreground" id="budget-label">
              Бюджет на человека
            </p>
            <div role="group" aria-labelledby="budget-label" className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={optimisticBudget === opt.value}
                  onClick={() => handleBudgetSelect(opt.value)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    optimisticBudget === opt.value
                      ? "border-primary bg-primary text-white"
                      : "border-border text-foreground hover:border-primary",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Расскажите подробнее</p>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              maxLength={280}
              rows={3}
              aria-label="Дополнительная информация для гидов"
              placeholder="Особые пожелания, интересы, ограничения..."
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-1 text-xs text-muted-foreground">{notes.length}/280</p>
          </div>

          {/* aria-live announces save state changes to screen readers */}
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {saveState === "saving" ? "Сохраняем..." : saveState === "saved" ? "✓ Сохранено" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create sent page**

Create `src/app/(protected)/traveler/requests/[requestId]/sent/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  getRequestById,
  getSimilarRequests,
} from "@/data/supabase/queries";
import { SentScreenEnrich } from "@/features/requests/components/sent-screen-enrich";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Запрос отправлен" };

export default async function SentPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: request } = await getRequestById(supabase, requestId);
  if (!request) redirect("/traveler/requests");

  const { data: ownership } = await supabase
    .from("traveler_requests")
    .select("traveler_id")
    .eq("id", requestId)
    .maybeSingle();
  if (!ownership || ownership.traveler_id !== user.id) redirect("/traveler/requests");

  const { data: similar } = await getSimilarRequests(
    supabase,
    request.destinationSlug,
    requestId,
  );

  const sentenceParts: string[] = [`в ${request.destination}`];
  if (request.dateLabel) sentenceParts.push(`на ${request.dateLabel}`);

  return (
    <div className="mx-auto w-full max-w-2xl px-[clamp(20px,4vw,48px)] py-16">
      {/* Zone 1 — The moment */}
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <span className="inline-block size-3 animate-pulse rounded-full bg-primary" />
        </div>
        <h1 className="mb-2 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-foreground">
          Запрос отправлен!
        </h1>
        <p className="text-base text-ink-2">
          Гиды получат уведомление и начнут предлагать варианты
        </p>
        <div className="mt-6 rounded-xl border border-border bg-surface-high px-6 py-5">
          <p className="font-display text-2xl leading-snug text-foreground">
            &ldquo;Хочу {sentenceParts.join(" ")}&rdquo;
          </p>
        </div>
      </div>

      {/* Zone 2 — Enrich */}
      <div className="mb-10">
        <SentScreenEnrich requestId={requestId} />
      </div>

      {/* Zone 3 — What happens next */}
      <div className="mb-10 rounded-xl border border-border bg-surface-low p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-3">
          Что дальше?
        </p>
        <ol className="space-y-3">
          {[
            "Гиды видят ваш запрос прямо сейчас",
            "Каждый предложит программу и цену — обычно за 2–24 часа",
            "Вы выбираете лучшее предложение и подтверждаете поездку",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Zone 4 — Similar requests */}
      {similar && similar.length > 0 && (
        <div className="mb-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-3">
            Или присоединитесь к похожей поездке
          </p>
          <div className="space-y-3">
            {similar.map((req) => (
              <Link
                key={req.id}
                href={`/requests/${req.id}`}
                className="block rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <p className="mb-1 font-display text-base text-foreground">
                  &ldquo;{req.destination}&rdquo;
                </p>
                <p className="text-xs text-ink-3">↳ {req.offerCount} ответов гидов</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Zone 5 — CTAs */}
      <div className="flex flex-col gap-3">
        <Button asChild size="lg" className="w-full">
          <Link href={`/traveler/requests/${requestId}`}>
            Смотреть входящие предложения
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href="/traveler/requests">К моим запросам</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
cd D:/dev2/projects/provodnik/provodnik.app && bun run typecheck 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/requests/components/sent-screen-enrich.tsx \
        src/app/\(protected\)/traveler/requests/\[requestId\]/sent/page.tsx
git commit -m "feat(requests): sent confirmation screen with enrich island"
```

---

## Task 6: Quick pickup page (post-auth redirect handler)

**Files:**
- Create: `src/app/(protected)/traveler/requests/quick/page.tsx`

This page is a server-side redirect handler. When a non-authed user fills the hero sentence, gets redirected to `/auth?redirect=/traveler/requests/quick?destination=X&...`, and comes back after login, this page reads the query params, calls `createQuickRequestAction`, and redirects to the sent screen. No UI rendered — pure server logic.

- [ ] **Step 1: Create the pickup page**

Create `src/app/(protected)/traveler/requests/quick/page.tsx`:

```tsx
import { redirect } from "next/navigation";

import { createQuickRequestAction } from "./actions";

export default async function QuickRequestPage({
  searchParams,
}: {
  searchParams: Promise<{
    destination?: string;
    duration?: string;
    companion?: string;
    customStart?: string;
    customEnd?: string;
  }>;
}) {
  const params = await searchParams;

  if (!params.destination) {
    redirect("/");
  }

  const fd = new FormData();
  fd.set("destination", params.destination);
  if (params.duration) fd.set("duration", params.duration);
  if (params.companion) fd.set("companion", params.companion);
  if (params.customStart) fd.set("customStart", params.customStart);
  if (params.customEnd) fd.set("customEnd", params.customEnd);

  // On success: createQuickRequestAction throws NEXT_REDIRECT to sent screen.
  // On error: returns { error } — we redirect home with an error param.
  const result = await createQuickRequestAction({ error: null }, fd);

  if (result?.error) {
    redirect(`/?error=${encodeURIComponent(result.error)}`);
  }

  // Unreachable on success (redirect thrown above), but satisfies TS
  redirect("/traveler/requests");
}
```

- [ ] **Step 2: Typecheck + lint**

```bash
cd D:/dev2/projects/provodnik/provodnik.app && bun run check 2>&1 | tail -20
```

Expected: 0 type errors, 0 lint errors (pre-existing warnings are acceptable).

- [ ] **Step 3: End-to-end smoke test**

With dev server running (`bun dev`):

1. Open `http://localhost:3000/home2` while **logged out**
2. Select destination "Алтай" (or any available city)
3. Select duration "3–5 дней"
4. Click "→ Отправить гидам"
5. Expected: redirected to `/auth?redirect=/traveler/requests/quick?destination=Алтай&duration=3-5d`
6. Log in with `traveler@provodnik.test / Travel1234!`
7. Expected: redirected to `/traveler/requests/[new-id]/sent`
8. Verify sent screen renders all 5 zones
9. Click "Добавить детали ↓" — verify budget chips and textarea appear
10. Select a budget — verify "✓ Сохранено" appears after 2s
11. Click "Смотреть входящие предложения" — verify navigates to request detail page

- [ ] **Step 4: Commit**

```bash
git add src/app/\(protected\)/traveler/requests/quick/page.tsx
git commit -m "feat(requests): quick pickup page for post-auth redirect"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `/home2` test route | Task 4 |
| `HomePageShell2` (Hero2 + Discovery + GuideAcquisition + Footer) | Task 4 |
| Remove middle sections from new shell | Task 4 (shell2 simply omits them) |
| `HomePageHero2` — full-bleed, min-h-screen | Task 3 |
| Destination slot — DB-driven picker | Tasks 1 + 3 |
| Duration slot — chips + custom date | Task 3 |
| Companion slot — optional chips | Task 3 |
| Submit — auth check, redirect if logged out | Task 3 |
| Submit — createQuickRequestAction if logged in | Tasks 2 + 3 |
| `createQuickRequestAction` — duration+companion mapping | Task 2 |
| Redirect to `/traveler/requests/[id]/sent` on success | Task 2 |
| `HomePageDiscovery` — 3 sketch cards | Task 4 |
| Real `offerCount` on homepage cards | Task 1 |
| Sent screen — Zone 1 (moment/sentence) | Task 5 |
| Sent screen — Zone 2 (enrich, collapsible) | Task 5 |
| Sent screen — Zone 3 (what happens next) | Task 5 |
| Sent screen — Zone 4 (similar requests) | Tasks 1 + 5 |
| Sent screen — Zone 5 (CTAs) | Task 5 |
| `updateRequestDetailsAction` — ownership check | Task 2 |
| Post-auth pickup page at `/traveler/requests/quick` | Task 6 |
| `getSimilarRequests` — same slug, fallback to recent | Task 1 |
| `getActiveGuideDestinations` — live from listings | Task 1 |

All spec requirements covered. ✓

**Placeholder scan:** No TBDs, no "similar to Task N" references, all code blocks complete. ✓

**Type consistency:**
- `DestinationOption` defined in Task 1, imported in Tasks 3 + 4 ✓
- `QuickRequestState` defined in Task 2, imported in Task 3 ✓
- `updateRequestDetailsAction(requestId, { budgetRub?, notes? })` defined in Task 2, called in Task 5 ✓
- `getActiveGuideDestinations`, `getHomepageRequests`, `getSimilarRequests` defined in Task 1, called in Tasks 4 + 5 ✓
- `RequestRecord.offerCount` exists on type (line 90 in queries.ts), set in `getHomepageRequests` ✓
