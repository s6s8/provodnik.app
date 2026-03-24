# Provodnik — Fix broken Unsplash image URLs

> Executor: Codex (orchestrator) + Cursor (code writer)
> Workspace: D:\dev\projects\provodnik\provodnik.app
> Package manager: bun
>
> Execution rules:
> - Cursor writes all code changes.
> - After changes: run bun run build. Fix before moving on.
> - Do not touch any files outside the scope of image URL replacement.

---

## Phase 0 — Replace all broken Unsplash URLs

**What**: Replace every Unsplash image URL in the codebase with verified working ones. The current URLs return 404 because the photo IDs no longer exist on Unsplash.

**Cursor task**:
```
Workspace: D:\dev\projects\provodnik\provodnik.app

Problem: Unsplash photo URLs in the source are returning 404. Replace ALL Unsplash image URLs
across every file in src/ with working Unsplash photo URLs that are appropriate for a Russian
travel marketplace (destinations, landscapes, guides/people, tours, nature, cities).

Use the Unsplash Source API format which always works:
  https://images.unsplash.com/photo-<ID>?auto=format&fit=crop&w=<W>&h=<H>&q=80

Use ONLY these verified working photo IDs (replace any existing ID with one from this list
that fits the context — landscape for destinations, portrait for guides, city for urban, etc.):

Landscapes / nature / destinations:
  photo-1506905925346-21bda4d32df4   (mountain lake)
  photo-1476514525535-07fb3b4ae5f1   (lake landscape)
  photo-1469474968028-56623f02e42e   (nature sunrise)
  photo-1447752875215-b2761acb3c5d   (forest)
  photo-1433086966358-54859d0ed716   (waterfall)
  photo-1455156218388-5e61287f7b4c   (snowy mountain)
  photo-1508193638397-1c4234db14d8   (arctic)
  photo-1551632811-561732d1e306     (mountain path)
  photo-1527489377706-5bf97e608852   (canyon)
  photo-1504280390367-361c6d9f38f4   (beach sunset)

Cities / architecture:
  photo-1513635269975-59663e0ac1ad   (city night)
  photo-1467269204594-9661b134dd2b   (old city)
  photo-1518684079-3c830dcef090     (moscow kremlin feel)
  photo-1537996194471-e657df975ab4   (bali/asia city)
  photo-1534430480872-3498386e7856   (city skyline)

Portraits / guides / people:
  photo-1507003211169-0a1dd7228f2d   (man portrait)
  photo-1438761681033-6461ffad8d80   (woman portrait)
  photo-1494790108377-be9c29b29330   (woman portrait 2)
  photo-1500648767791-00dcc994a43e   (man smiling)
  photo-1506794778202-cad84cf45f1d   (man serious)
  photo-1504593811423-6dd665756598   (man outdoor)
  photo-1544005313-94ddf0286df2     (woman smiling)
  photo-1488426862026-3ee34a7d66df   (woman natural)

Tours / activities / travel:
  photo-1501555088652-021faa106b9b   (travel backpack)
  photo-1527631746610-bca00a040d60   (hiking)
  photo-1452421822248-d4c2b47f0c81   (camping)
  photo-1539635278303-d4002c07eae3   (group travel)
  photo-1464822759023-fed622ff2c3b   (adventure)

Files to change — replace ALL Unsplash URLs in:
1. src/data/destinations/seed.ts
   - use landscape/city photos appropriate for each destination name

2. src/data/open-requests/seed.ts
   - use travel/activity photos

3. src/data/public-guides/seed.ts
   - use portrait photos for guide avatars

4. src/data/public-listings/seed.ts
   - use landscape/tour photos for listings

5. src/features/homepage/components/homepage-shell.tsx
   - use high-quality landscape/destination photos

6. src/features/home/components/hero-section.tsx
   - use dramatic landscape photo for hero

7. src/features/home/components/layout-grid-showcase.tsx
   - use varied landscape/city/activity photos

8. src/features/destinations/components/public/public-destination-detail-screen.tsx
   - use landscape photos

9. src/features/listings/components/public/listing-detail.tsx
   - use activity/tour photos

10. src/features/requests/components/public/request-detail.tsx
    - use travel photos

11. src/features/reference/home/page3-home-page.tsx
    - use landscape/destination photos

12. src/app/(site)/destinations/page.tsx
    - use destination landscape photos

Rules:
- Every image URL must use a photo ID from the verified list above.
- Match photo type to context (portrait for people, landscape for places, etc.).
- Keep the same w= h= q= parameters already in each URL, just swap the photo ID.
- Do not leave any of the original broken photo IDs in place.

Acceptance: bun run build completes with no errors.
```

---

## Final verification

```bash
cd D:\dev\projects\provodnik\provodnik.app
bun run build
```

## Codex execution command

```bash
cd D:\dev\projects\provodnik
codex exec --dangerously-bypass-approvals-and-sandbox "Read D:\dev\projects\provodnik\PLAN-images.md fully. Execute Phase 0 by delegating the Cursor task verbatim to: cursor-agent --model auto --yolo -p --workspace D:\dev\projects\provodnik\provodnik.app. After Cursor finishes run: cd D:\dev\projects\provodnik\provodnik.app && bun run build. Fix any errors before reporting done." 2>&1 &
echo "Codex PID: $!"
```
