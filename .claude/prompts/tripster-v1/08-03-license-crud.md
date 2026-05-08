# Phase 8.3 — Profile: guide license CRUD

**Persona:** Implementation. Follow spec exactly. No extras.

## CONTEXT

**Workspace:** `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p8-3`
**Branch:** `feat/tripster-v1-p8-3`

Tech stack: Next.js 15 App Router, TypeScript, React 19, Tailwind CSS v4, shadcn/ui, Supabase (@supabase/ssr), Bun.

**Supabase server client:** `import { createSupabaseServerClient } from "@/lib/supabase/server";`
**Supabase browser client:** `import { createSupabaseBrowserClient } from "@/lib/supabase/client";`

**Relevant types** (from `src/lib/supabase/types.ts`):
```ts
// guide_licenses table (many-to-many: guide ↔ listing scopes)
export type ListingLicenseRow = {
  listing_id: string;
  license_id: string;
  scope: string;  // "all" | specific listing IDs comma-joined
};
```

Note: There may be a separate `guide_licenses` or `licenses` table. Read types.ts to understand the actual schema before coding.

**shadcn/ui:** Button, Card, Input, Label, Textarea, Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter

## SCOPE

**Create:**
1. `src/app/(protected)/profile/guide/license/page.tsx` — license management page (server)
2. `src/features/profile/components/LicenseManager.tsx` — license CRUD (client)
3. `src/features/profile/actions/licenseActions.ts` — Server Actions

**DO NOT touch:** Legal information page, listings.

## TASK

### 1. licenseActions.ts

```ts
"use server";

export async function addLicense(data: { licenseType: string; licenseNumber: string; issuedBy: string; validUntil: string | null; scope: string }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  // Insert into guide_licenses (or licenses table per actual schema)
  // Read the actual table name from types.ts first
  return { success: true };
}

export async function deleteLicense(licenseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  await supabase.from("listing_licenses").delete().eq("license_id", licenseId);
  return { success: true };
}
```

Adapt the `addLicense` function to match the actual schema in types.ts.

### 2. LicenseManager.tsx (client)

Shows list of existing licenses with:
- License type/number display
- Scope badge: "Все предложения" or specific listing names
- Delete button per license

"Добавить лицензию" button opens inline form or Dialog:
- License type (text input): "Тип документа (аттестат, удостоверение, ...)"
- License number: "Номер документа"
- Issued by: "Кем выдан"
- Valid until: date input (optional)
- Scope: Switch "Применить ко всем предложениям" → sets scope="all"; otherwise show multi-select of guide's active listings

Submit → `addLicense()` → refresh list.

### 3. page.tsx (server)

```tsx
const supabase = await createSupabaseServerClient();
const { data: { user } } = await supabase.auth.getUser();
// Fetch guide's licenses
// Fetch guide's listings for scope selector
// Render <LicenseManager licenses={...} listings={...} />
```

## INVESTIGATION RULE

Read before writing:
- `src/lib/supabase/types.ts` — find actual license table name and fields
- `src/app/(protected)/profile/` — existing profile page structure

## TDD CONTRACT

No unit tests. TypeScript compile must pass.

## ENVIRONMENT

Working directory: `D:\dev2\projects\provodnik\.claude\worktrees-app\tripster-v1-p8-3`
Bun: `C:\Users\x\.bun\bin\bun`
Type check: `C:\Users\x\.bun\bin\bun run typecheck`
Lint: `C:\Users\x\.bun\bin\bun run lint`

## DONE CRITERIA

- License list shows existing licenses
- Add form with all fields including scope selector
- Delete works
- `bun run typecheck` exits 0
- `bun run lint` exits 0
- Commit: `feat(profile): guide license CRUD — add/delete with scope selector`
- Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
