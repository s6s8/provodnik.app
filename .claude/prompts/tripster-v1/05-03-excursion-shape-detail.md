# Phase 5.3 — Traveler surfaces: excursion-shape listing detail

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-3`
**Branch:** `feat/tripster-v1-p5-3`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

This wave implements the **excursion-shape** detail template, which serves 6 of the 8 listing types:
`excursion`, `waterwalk`, `masterclass`, `photosession`, `quest`, `activity`

**Supabase server client:**
```ts
import { createSupabaseServerClient } from "@/lib/supabase/server";
```

**Relevant types:**
```ts
export type ListingRow = {
  id: string;
  guide_id: string;
  slug: string;
  title: string;
  region: string;
  city: string | null;
  description: string | null;
  exp_type: "excursion" | "waterwalk" | "masterclass" | "photosession" | "quest" | "activity" | "tour" | "transfer" | null;
  format: "group" | "private" | "combo" | null;
  movement_type: string | null;
  languages: string[];
  duration_minutes: number | null;
  max_group_size: number;
  price_from_minor: number;
  currency: string;
  status: string;
  idea: string | null;
  route: string | null;
  theme: string | null;
  audience: string | null;
  facts: string | null;
  org_details: Record<string, unknown> | null;
  booking_cutoff_hours: number;
  event_span_hours: number | null;
  instant_booking: boolean;
  average_rating: number;
  review_count: number;
  image_url: string | null;
};

export type ListingPhotoRow = {
  id: string;
  listing_id: string;
  url: string;
  position: number;
  alt_text: string | null;
};

export type ListingScheduleRow = {
  id: string;
  listing_id: string;
  weekday: number | null; // 0=Mon…6=Sun
  time_start: string;
  time_end: string;
};

export type ListingTariffRow = {
  id: string;
  listing_id: string;
  label: string;
  price_minor: number;
  currency: string | null;
  min_persons: number | null;
  max_persons: number | null;
};

export type GuideProfileRow = {
  user_id: string;
  slug: string | null;
  display_name: string | null;
  bio: string | null;
  average_rating: number;
  review_count: number;
  contact_visibility_unlocked: boolean;
  // ...
};
```

**PII masking (must import):**
```ts
import { maskPii } from "@/lib/pii/mask";
// Use maskPii() on: description, idea, route, theme, audience, facts, org_details stringified values
// — these fields may contain contact info posted by guides before the PII gate existed
```

**shadcn/ui:** Button, Badge, Card, Separator, Skeleton, Tabs, Avatar

## SCOPE

**Create:**
1. `src/app/(public)/listings/[id]/page.tsx` — server component listing detail router
2. `src/components/listing-detail/ExcursionShapeDetail.tsx` — excursion-shape template
3. `src/components/listing-detail/PhotoGallery.tsx` — photo gallery component
4. `src/components/listing-detail/ScheduleDisplay.tsx` — weekly schedule display
5. `src/components/listing-detail/TariffsList.tsx` — tariffs display
6. `src/components/listing-detail/GuideCard.tsx` — guide mini-card with avatar + rating

**DO NOT touch:** Any editor components, admin pages, or auth flows.

## TASK

### 1. `src/app/(public)/listings/[id]/page.tsx` (server component)

```tsx
export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  
  if (!listing) notFound();
  
  // Fetch related data in parallel
  const [photosRes, scheduleRes, tariffsRes, guideRes] = await Promise.all([
    supabase.from("listing_photos").select("*").eq("listing_id", id).order("position"),
    supabase.from("listing_schedule").select("*").eq("listing_id", id).order("weekday"),
    supabase.from("listing_tariffs").select("*").eq("listing_id", id),
    supabase.from("guide_profiles").select("user_id, slug, display_name, bio, average_rating, review_count, contact_visibility_unlocked").eq("user_id", listing.guide_id).maybeSingle(),
  ]);
  
  const photos = photosRes.data ?? [];
  const schedule = scheduleRes.data ?? [];
  const tariffs = tariffsRes.data ?? [];
  const guide = guideRes.data;
  
  // Route to correct template based on exp_type
  if (listing.exp_type === "tour") {
    // Tour detail — handled in wave 5.4; for now, use ExcursionShapeDetail as placeholder
  }
  if (listing.exp_type === "transfer") {
    // Transfer detail — handled in wave 5.5; use ExcursionShapeDetail as placeholder
  }
  
  return (
    <ExcursionShapeDetail
      listing={listing}
      photos={photos}
      schedule={schedule}
      tariffs={tariffs}
      guide={guide}
    />
  );
}
```

Also export `generateMetadata`:
```tsx
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("listings").select("title, description").eq("id", id).maybeSingle();
  return {
    title: data?.title ?? "Предложение",
    description: data?.description?.slice(0, 160) ?? "",
  };
}
```

### 2. ExcursionShapeDetail.tsx (server component)

Props:
```ts
interface Props {
  listing: ListingRow;
  photos: ListingPhotoRow[];
  schedule: ListingScheduleRow[];
  tariffs: ListingTariffRow[];
  guide: Pick<GuideProfileRow, "user_id" | "slug" | "display_name" | "bio" | "average_rating" | "review_count" | "contact_visibility_unlocked"> | null;
}
```

Apply PII masking to text fields before rendering:
```ts
const description = maskPii(listing.description);
const idea = maskPii(listing.idea);
const route = maskPii(listing.route);
const theme = maskPii(listing.theme);
const audience = maskPii(listing.audience);
const facts = maskPii(listing.facts);
```

Layout (two-column on desktop: content left, booking sidebar right):

```
[PhotoGallery photos={photos} coverUrl={listing.image_url} ]
[header: title + exp_type badge + format + duration + rating]
[sticky booking sidebar (right, md:w-80)]:
  - "от {price_from_minor÷100} ₽" large text
  - duration, format, max_group_size
  - instant_booking badge if true
  - "Заказать" Button → /listings/{id}/book
  - "Задать вопрос" Button → /listings/{id}/book?tab=question

[main content (left)]:
  - description (masked)
  - if idea: "Идея" section
  - if route: "Маршрут" section
  - if theme: "Тема" section
  - [TariffsList tariffs={tariffs} ]
  - [ScheduleDisplay schedule={schedule} ] (if schedule not empty)
  - if audience: "Для кого" section
  - if facts: "Интересные факты" section
  - [GuideCard guide={guide} ]
```

On mobile: booking sidebar collapses to a fixed bottom bar with price + "Заказать" button.

Russian exp_type labels (for badge):
```ts
const EXP_TYPE_LABELS: Record<string, string> = {
  excursion: "Экскурсия",
  waterwalk: "Прогулка на воде",
  masterclass: "Мастер-класс",
  photosession: "Фотосессия",
  quest: "Квест",
  activity: "Активность",
  tour: "Тур",
  transfer: "Трансфер",
};
```

Format labels:
```ts
const FORMAT_LABELS: Record<string, string> = {
  group: "Групповой",
  private: "Индивидуальный",
  combo: "Группа или индивидуально",
};
```

Duration formatting:
```ts
function formatDuration(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} ч`;
  return `${h} ч ${m} мин`;
}
```

### 3. PhotoGallery.tsx

Props: `{ photos: ListingPhotoRow[]; coverUrl: string | null; }`

Build combined list: `[coverUrl, ...photos.map(p => p.url)].filter(Boolean)` deduplicated.

- If 1 photo: large single image, aspect-ratio 16:9, object-cover
- If 2-3 photos: 2-column grid
- If 4+ photos: large cover left + 4-grid right (desktop), vertical scroll (mobile)

Each image uses `<img>` with object-cover. No Next.js Image (avoid configuration issues).

### 4. ScheduleDisplay.tsx

Props: `{ schedule: ListingScheduleRow[] }`

Weekday labels: `["Пн","Вт","Ср","Чт","Пт","Сб","Вс"]` (index 0=Mon)

Render as a compact table or list:
- Group by weekday
- Show: "Пн — 10:00–12:00, 14:00–16:00"
- If no schedule: render nothing (empty fragment)

### 5. TariffsList.tsx

Props: `{ tariffs: ListingTariffRow[]; priceFromMinor: number; }`

If tariffs.length === 0: show "от {priceFromMinor÷100} ₽" as the single price.
If tariffs.length > 0: render as a table:
| Тариф | Цена | Группа |
| label | price÷100 ₽ | min–max persons |

### 6. GuideCard.tsx

Props: guide object (nullable).

If null: render nothing.

Small card at bottom of listing:
- Avatar (initials fallback)
- display_name
- "★ {average_rating.toFixed(1)} · {review_count} отзывов"
- brief bio (2-line clamp, masked: `maskPii(guide.bio)`)
- Link to `/guides/{guide.slug}` if slug exists

## INVESTIGATION RULE

Before writing, read:
- `src/app/(public)/` — existing route structure, understand layout
- `src/lib/pii/mask.ts` — confirm maskPii signature
- `src/lib/supabase/server.ts` — confirm export name
- `src/lib/supabase/types.ts` — confirm all type shapes

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p5-3`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- 6 files created
- `/listings/[id]` renders correctly for excursion-shape types
- PII is masked in all free-text fields
- Booking sidebar links to `/listings/{id}/book`
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(traveler): excursion-shape listing detail — gallery/schedule/tariffs/guide card`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
