# API_REFERENCE.md — Context7 Doc Cache

_Fetched 2026-04-11. Reused across cursor-agent prompts for the P1 alex-feedback batch._

---

## react-day-picker v9 (`/gpbl/react-day-picker`)

NOT installed yet — add via `bun add react-day-picker date-fns` as part of task E2.

### Range mode with disabled past dates

```tsx
import { useState } from "react";
import { format, addDays } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";

export function DateRangePicker({ value, onChange }: {
  value: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
}) {
  return (
    <DayPicker
      mode="range"
      min={1}
      max={30}
      selected={value}
      onSelect={onChange}
      disabled={{ before: new Date() }}
      excludeDisabled
    />
  );
}
```

- Import CSS once: `import "react-day-picker/style.css"`
- `DateRange` shape: `{ from: Date | undefined, to?: Date | undefined }`
- `disabled={{ before: new Date() }}` → cannot pick past dates
- `min`/`max` cap selectable day count in range
- `excludeDisabled` resets range if it spans a disabled date

### Single date mode
```tsx
<DayPicker mode="single" disabled={{ before: new Date() }} selected={date} onSelect={setDate} />
```

---

## Supabase Storage (`/supabase/supabase`) — already in project

### Browser upload
```typescript
const file = event.target.files[0];
const { data, error } = await supabase.storage
  .from('tour-photos')
  .upload(`${userId}/${listingId}/${crypto.randomUUID()}.webp`, file);
```

### RLS: public read + owner-scoped writes
```sql
create policy "Public Access"
  on storage.objects for select
  using (bucket_id = 'tour-photos');

create policy "Owner Upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'tour-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owner Delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'tour-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Server Component + Server Action (Next.js 15 pattern)
```typescript
export default async function Page() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from('listings').select();

  async function createMedia(formData: FormData) {
    'use server';
    const supabase = createSupabaseServerClient();
    await supabase.from('listing_media').insert({ /* ... */ });
  }

  return /* JSX using createMedia as form action */;
}
```

---

## Supabase Realtime (`/supabase/supabase`) — already in project

### ✅ Use broadcast (current best practice, 2024+)

```sql
-- Trigger function: broadcasts on insert/update/delete
CREATE OR REPLACE FUNCTION broadcast_message_changes()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'room:' || NEW.thread_id::text || ':messages',
    TG_OP, TG_OP, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW, OLD
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER messages_broadcast_trigger
  AFTER INSERT OR UPDATE OR DELETE ON messages
  FOR EACH ROW EXECUTE FUNCTION broadcast_message_changes();
```

### Client subscription
```typescript
'use client';
const threadId = 'abc';
await supabase.realtime.setAuth();          // REQUIRED
const channel = supabase
  .channel(`room:${threadId}:messages`, { config: { private: true } })
  .on('broadcast', { event: 'INSERT' }, (p) => /* append */)
  .on('broadcast', { event: 'UPDATE' }, (p) => /* edit */)
  .on('broadcast', { event: 'DELETE' }, (p) => /* remove */)
  .subscribe();

return () => { supabase.removeChannel(channel); };
```

### ❌ Deprecated — do NOT use
```typescript
// DO NOT WRITE NEW CODE WITH THIS PATTERN
.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, cb)
```

**Project note:** `src/features/messaging/hooks/use-realtime-messages.ts` already exists. Inspect it before touching realtime — likely already uses the correct pattern.

---

## shadcn/ui (`/shadcn-ui/ui`) — already in project

### Form with react-hook-form + zod
```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  dates: z.object({ from: z.date(), to: z.date() }),
  peopleCount: z.number().int().min(1).max(50),
  note: z.string().max(500).optional(),
});

export function BookTourDialogForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: "", email: "", phone: "", peopleCount: 1, note: "" },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    await createBookingRequestAction(data);   // server action
  }

  return <form onSubmit={form.handleSubmit(onSubmit)}>{/* fields */}</form>;
}
```

### Dialog (accessibility: title is REQUIRED; use className="sr-only" to hide)
```tsx
<Dialog>
  <DialogTrigger asChild><Button>Забронировать</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Забронировать тур</DialogTitle>
      <DialogDescription>Отправьте заявку менеджеру</DialogDescription>
    </DialogHeader>
    {/* form */}
  </DialogContent>
</Dialog>
```

### Sheet (mobile drawer / side panel)
```tsx
<Sheet>
  <SheetTrigger asChild><Button>Меню</Button></SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Меню</SheetTitle>
      <SheetDescription className="sr-only">Навигация</SheetDescription>
    </SheetHeader>
    {/* nav items */}
  </SheetContent>
</Sheet>
```

---

## Project-specific conventions (from inner-repo scan)

- **Tours = "listings"** in code. Paths: `src/app/(site)/listings/...`, components `listing-card.tsx`, Zod schema `src/data/guide-listing/schema.ts`.
- **Route groups:** `(home)` · `(site)` public · `(auth)` · `(protected)` role-gated (traveler/guide/admin/messages/notifications).
- **Auth guards are layout-based + middleware + RLS** — there is no `requireTraveler()` helper. Role is read via `readAuthContextFromServer()` in root layout; workspace layouts redirect mismatched roles.
- **Supabase clients:** `createSupabaseServerClient()` (server), `createSupabaseBrowserClient()` (client), `createSupabaseMiddlewareClient()` (middleware), `createAdminClient()` (admin).
- **Role routing helpers:** `src/lib/auth/role-routing.ts` — `isAppRole`, `getDashboardPathForRole`, `roleHasAccess`, `isProtectedRolePathname`.
- **Site header:** `src/components/shared/site-header.tsx` (client). Receives `{ isAuthenticated, role, email }` as props from server.
- **Footer:** `src/components/shared/site-footer.tsx`.
- **Storage buckets migration:** `supabase/migrations/20260401200000_storage_buckets.sql` — buckets exist (tour-images, guide-documents, dispute-evidence, etc.).
- **Realtime messaging hook:** `src/features/messaging/hooks/use-realtime-messages.ts` — infrastructure already wired.
- **Notifications service:** `src/lib/notifications/create-notification.ts` + `triggers.ts` — infrastructure exists.
- **Test runner:** Vitest. Run with `bun run test:run`. Files live under `src/**/__tests__/`.
- **Lint/typecheck:** `bun run typecheck`, `bun run lint`, `bun run check` (both combined). On Windows bun may flake — fallback: `node node_modules/typescript/bin/tsc --noEmit && node node_modules/eslint/bin/eslint.js .`.
