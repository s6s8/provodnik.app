#!/usr/bin/env node
// Guard rail: canonical-helper enforcement (see docs/COMPONENT_AUDIT.md + .claude/sot/CANON_COMPONENTS.md).
// Each rule bans a pattern everywhere except its canonical home. Files that violated the rule
// before the guard existed are frozen in `allow` — they may only shrink (audit waves W1–W6).
// Adding a NEW violation in a NEW file fails the commit. Do not add to `allow` without operator approval.
//
// Usage: node scripts/lint-canon.mjs   (exit 1 on new violations; stale allow entries are informational)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(process.cwd(), "src");
const SKIP_DIR = new Set(["node_modules", ".next", ".turbo", "dist", "__tests__"]);

const RULES = [
  {
    id: "money-intl",
    pattern: /Intl\.NumberFormat/,
    message:
      "Currency formatting is canonical in src/data/money.ts (formatRub / formatRubFromMinor / formatRubNumber) — do not re-implement Intl.NumberFormat.",
    canonical: ["src/data/money.ts"],
    allow: [
      "src/app/(protected)/admin/bookings/page.tsx",
      "src/app/(protected)/admin/listings/page.tsx",
      "src/app/(protected)/guide/calendar/page.tsx",
      "src/app/(protected)/listings/[id]/book/page.tsx",
      "src/features/admin/components/disputes/dispute-case-detail.tsx",
      "src/features/bookings/components/booking-detail-screen.tsx",
      "src/features/guide/components/bookings/guide-bookings-screen.tsx",
      "src/features/partner/components/PayoutsLedger.tsx",
      "src/features/requests/components/request-detail-screen.tsx",
      "src/features/traveler/components/requests/offer-card.tsx",
      "src/features/traveler/components/trip-card/trip-card.tsx",
    ],
  },
  {
    id: "date-fmt",
    pattern: /toLocaleDateString|toLocaleTimeString|Intl\.DateTimeFormat|toLocaleString\("ru/,
    message:
      "Date formatting is canonical in src/lib/dates.ts (Moscow-pinned formatRussianDate* helpers) — do not roll toLocaleDateString/Intl.DateTimeFormat locally (AP-010 territory).",
    canonical: ["src/lib/dates.ts"],
    allow: [
      "src/app/(protected)/bookings/[bookingId]/dispute/page.tsx",
      "src/app/(protected)/bookings/[bookingId]/review/page.tsx",
      "src/app/(protected)/guide/bookings/[bookingId]/actions.ts",
      "src/components/listing-detail/TourDeparturesList.tsx",
      "src/components/listing-detail/TourItineraryDisplay.tsx",
      "src/components/shared/guide-offer-card.tsx",
      "src/components/shared/listing-card.tsx",
      "src/components/shared/public-guide-card.tsx",
      "src/data/supabase/queries/core.ts",
      "src/features/bookings/components/BookingFormTabs.tsx",
      "src/features/guide/components/calendar/MonthlyCalendar.tsx",
      "src/features/guide/components/calendar/WeeklyCalendar.tsx",
      "src/features/guide/components/public/guide-profile-screen.tsx",
      "src/features/guide/components/requests/bid-form-panel.tsx",
      "src/features/guide/components/requests/guide-inbox-card-header.tsx",
      "src/features/guide/components/requests/guide-requests-inbox-screen.tsx",
      "src/features/homepage-classic/components/homepage-request-form-classic.tsx",
      "src/features/homepage/components/slot-chips.tsx",
      "src/features/messaging/components/OfferCard.tsx",
      "src/features/messaging/components/SystemEventMessage.tsx",
      "src/features/messaging/components/conversation-list.tsx",
      "src/features/partner/components/ApiTokenManager.tsx",
      "src/features/partner/components/PayoutsLedger.tsx",
      "src/features/referrals/components/BonusLedger.tsx",
      "src/features/requests/components/request-detail-screen.tsx",
      "src/features/requests/components/steps/step-details.tsx",
      "src/features/requests/owner-request-actions.ts",
      "src/features/reviews/components/ReviewCard.tsx",
      "src/features/traveler/components/requests/offer-card.tsx",
      "src/features/traveler/components/trip-card/trip-card.tsx",
      "src/lib/notifications/triggers.ts",
    ],
  },
  {
    id: "window-confirm",
    pattern: /window\.confirm/,
    message:
      "Use useConfirm from src/components/shared/confirm-dialog.tsx — destructive actions must get the canon dialog, not browser confirm.",
    canonical: ["src/components/shared/confirm-dialog.tsx"],
    allow: [
      "src/features/guide/components/calendar/day-panel.tsx",
      "src/features/guide/components/portfolio/guide-portfolio-screen.tsx",
      "src/features/partner/components/ApiTokenManager.tsx",
    ],
  },
  {
    id: "glass-inline",
    pattern: /bg-glass backdrop-blur-\[20px\]/,
    message:
      "Use <GlassCard> from src/components/shared/glass-card.tsx instead of inlining the glass class string.",
    canonical: [
      "src/components/shared/glass-card.tsx",
      "src/components/ui/card.tsx",
      "src/components/ui/tabs.tsx",
    ],
    allow: [
      "src/app/(protected)/admin/disputes/[caseId]/loading.tsx",
      "src/app/(protected)/bookings/[bookingId]/review/loading.tsx",
      "src/app/(protected)/guide/bookings/[bookingId]/loading.tsx",
      "src/app/(site)/destinations/[slug]/loading.tsx",
      "src/app/(site)/guides/[slug]/loading.tsx",
      "src/app/(site)/requests/[requestId]/loading.tsx",
      "src/features/guide/components/public/public-guide-card.tsx",
    ],
  },
  {
    id: "page-container-inline",
    pattern: /max-w-page px-\[clamp/,
    message:
      "Page container idiom belongs in one component (PageContainer, planned src/components/ui/page-container.tsx — audit W3). Do not inline the clamp string in new files.",
    canonical: ["src/components/ui/page-container.tsx"],
    allow: [
      "src/app/(protected)/error.tsx",
      "src/app/(site)/destinations/[slug]/loading.tsx",
      "src/app/(site)/error.tsx",
      "src/app/(site)/guides/[slug]/loading.tsx",
      "src/app/(site)/listings/[id]/loading.tsx",
      "src/app/(site)/listings/page.tsx",
      "src/app/(site)/requests/[requestId]/loading.tsx",
      "src/app/(site)/requests/page.tsx",
      "src/components/listing-detail/ExcursionShapeDetail.tsx",
      "src/components/listing-detail/TourShapeDetail.tsx",
      "src/components/shared/discovery-shell.tsx",
      "src/components/shared/site-footer.tsx",
      "src/features/destinations/components/destination-detail-screen.tsx",
      "src/features/guide/components/public/guide-profile-screen.tsx",
    ],
  },
  {
    id: "raw-form-elements",
    pattern: /<(select|textarea)[\s>]/,
    message:
      "Use src/components/ui/select.tsx / textarea.tsx — raw <select>/<textarea> outside src/components/ui is a primitive bypass.",
    canonical: [], // everything under src/components/ui is exempt via prefix below
    canonicalPrefix: "src/components/ui/",
    allow: [
      "src/features/guide/components/calendar/MonthlyCalendar.tsx",
      "src/features/guide/components/excursions/guide-excursions-screen.tsx",
      "src/features/guide/components/profile/guide-about-form.tsx",
      "src/features/guide/components/requests/bid-form-panel.tsx",
      "src/features/guide/components/requests/guide-requests-inbox-screen.tsx",
      "src/features/requests/components/sent-screen-enrich.tsx",
    ],
  },
];

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\./.test(entry)) files.push(p);
  }
})(ROOT);

let failed = false;
const staleAllow = [];

for (const rule of RULES) {
  const exempt = new Set([...rule.canonical, ...rule.allow]);
  const stillMatching = new Set();
  for (const abs of files) {
    const rel = relative(process.cwd(), abs).split(sep).join("/");
    const src = readFileSync(abs, "utf8");
    if (!rule.pattern.test(src)) continue;
    stillMatching.add(rel);
    if (exempt.has(rel)) continue;
    if (rule.canonicalPrefix && rel.startsWith(rule.canonicalPrefix)) continue;
    failed = true;
    const line = src.split("\n").findIndex((l) => rule.pattern.test(l)) + 1;
    console.error(`✗ [${rule.id}] ${rel}:${line}\n  ${rule.message}`);
  }
  for (const a of rule.allow) if (!stillMatching.has(a)) staleAllow.push(`[${rule.id}] ${a}`);
}

if (staleAllow.length) {
  console.log(
    `ℹ ${staleAllow.length} allowlist entr${staleAllow.length === 1 ? "y is" : "ies are"} clean now — remove from scripts/lint-canon.mjs:\n  ` +
      staleAllow.join("\n  ")
  );
}

if (failed) {
  console.error(
    "\nlint:canon failed — a canonical helper/component already exists for this pattern." +
      "\nSee .claude/sot/CANON_COMPONENTS.md. Do not extend the allowlist without operator approval."
  );
  process.exit(1);
}
console.log("lint:canon ok");
