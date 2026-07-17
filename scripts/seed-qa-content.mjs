// Local-only content fixture for browser QA (Wildberries 2026-07-14 evidence run).
//
// `scripts/seed-test-users.mjs` seeds LOGINS (qa-admin / qa-guide / qa-traveler on
// @example.com). Those accounts are invisible on every public surface by design:
// `src/lib/supabase/homepage.ts` drops demo domains, and `isQaGuideSlug` drops
// "qa-" slugs from /guides. So a login-only seed can never prove the homepage,
// the catalog, or the guide grid. This script adds the missing half: real-looking,
// non-demo inventory (guides, listings, reviews, requests) so the marketplace
// surfaces render with honest data.
//
// Fictional people; no real PII. Local Supabase only — the script refuses to run
// against anything but 127.0.0.1/localhost.
//
// usage: bun scripts/seed-qa-content.mjs .env.local
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const dotenvPath = process.argv[2] ?? ".env.local";
const env = Object.fromEntries(
  readFileSync(dotenvPath, "utf-8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).replace(/^"|"$/g, "").trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY");
if (!/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(url)) {
  throw new Error(`refusing to seed a non-local Supabase: ${url}`);
}

const password = env.QA_SEED_PASSWORD ?? "WbQa!2026#local";
const supa = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

/** Fixture people. Emails are NOT on a demo domain, slugs do NOT start with "qa-" —
 *  both are hard requirements for a row to reach a public surface. */
const GUIDES = [
  {
    email: "bair.ochirov@provodnik.app",
    fullName: "Баир Очиров",
    displayName: "Баир",
    phone: "+7 900 000-00-11",
    slug: "bair-elista",
    baseCity: "Элиста",
    regions: ["Калмыкия"],
    bio: "Вожу по степи и буддийским местам Калмыкии восьмой год. Показываю не открытки, а живой регион.",
    years: 8,
    rating: 4.9,
    tours: 124,
  },
  {
    email: "nayan.zadvaev@provodnik.app",
    fullName: "Наян Задваев",
    displayName: "Наян",
    phone: "+7 900 000-00-12",
    slug: "nayan-astrakhan",
    baseCity: "Астрахань",
    regions: ["Астраханская область"],
    bio: "Астраханский кремль, дельта Волги и лотосовые поля. Маршруты для тех, кто не любит спешить.",
    years: 6,
    rating: 4.8,
    tours: 87,
  },
  {
    // Deliberately phoneless: this is the item-18 fixture (admin must flag it,
    // and the guide cabinet must prompt for a phone).
    email: "gilyana.mandzhieva@provodnik.app",
    fullName: "Гиляна Манджиева",
    displayName: "Гиляна",
    phone: null,
    slug: "gilyana-elista",
    baseCity: "Элиста",
    regions: ["Калмыкия"],
    bio: "Гастрономические маршруты: калмыцкий чай, борцоги, домашние кухни Элисты.",
    years: 3,
    rating: 4.7,
    tours: 19,
  },
  {
    email: "sunil.munilov@provodnik.app",
    fullName: "Сунил Мунилов",
    displayName: "Сунил",
    phone: "+7 900 000-00-14",
    slug: "sunil-sochi",
    baseCity: "Сочи",
    regions: ["Краснодарский край"],
    bio: "Горы и море за один день. Авторские маршруты по окрестностям Сочи.",
    years: 11,
    rating: 5.0,
    tours: 210,
  },
];

const TRAVELERS = [
  { email: "irina.petrova@provodnik.app", fullName: "Ирина Петрова" },
  { email: "oleg.smirnov@provodnik.app", fullName: "Олег Смирнов" },
];

/** status mix is load-bearing: item 11 asks the admin to see drafts and moderation
 *  queue items for a specific guide, not just what is live.
 *
 *  `format` is load-bearing too: it is nullable with no default, and every public
 *  price surface routes through formatExcursionPriceFrom, which can only say
 *  «за одного» / «за группу до N человек» when it is set. Seeding it NULL rendered
 *  a bare «от 4 500 ₽» everywhere — the exact ambiguity the price copy exists to
 *  prevent. `group` = price per person; `private` = price for the whole group. */
const LISTINGS = [
  { guide: 0, slug: "step-i-hurul", title: "Степь и хурул: сердце Калмыкии", city: "Элиста", region: "Калмыкия", price: 450000, format: "group", status: "published", rank: 1, duration: 300, group: 8, summary: "Золотая обитель, шахматный город и ночёвка в степи." },
  { guide: 1, slug: "astrakhanskiy-kreml-i-lotosy", title: "Астраханский кремль и лотосовые поля", city: "Астрахань", region: "Астраханская область", price: 380000, format: "group", status: "published", rank: 2, duration: 420, group: 6, summary: "Кремль, купеческие кварталы и выход к лотосам на закате." },
  { guide: 3, slug: "sochi-gory-i-more", title: "Сочи: горы и море за один день", city: "Сочи", region: "Краснодарский край", price: 620000, format: "private", status: "published", rank: 3, duration: 480, group: 4, summary: "Красная Поляна утром, галечный берег вечером." },
  { guide: 2, slug: "gastrotur-kalmyckiy-chay", title: "Гастротур: калмыцкий чай и борцоги", city: "Элиста", region: "Калмыкия", price: 290000, format: "group", status: "published", rank: 4, duration: 240, group: 10, summary: "Три домашние кухни, чай с молоком и солью, борцоги из печи." },
  { guide: 2, slug: "zakat-na-manyche", title: "Закат на Маныче", city: "Элиста", region: "Калмыкия", price: 350000, format: "group", status: "pending_review", rank: null, duration: 300, group: 6, summary: "Озеро Маныч-Гудило, тюльпановая степь, закат на воде." },
  { guide: 2, slug: "buddiyskie-mesta-kalmykii", title: "Буддийские места Калмыкии", city: "Элиста", region: "Калмыкия", price: 400000, format: "private", status: "draft", rank: null, duration: 360, group: 8, summary: "Хурулы, ступы и одинокий тополь." },
];

const REVIEWS = [
  { guide: 0, traveler: 0, listing: 0, rating: 5, title: "Степь не отпускает", body: "Баир показал Калмыкию так, как её не увидишь самостоятельно. Отдельное спасибо за ночную степь — это лучшее, что было за поездку." },
  { guide: 1, traveler: 1, listing: 1, rating: 5, title: "Астрахань без спешки", body: "Наян знает город изнутри: провёл дворами, показал кремль в правильном свете и вывез к лотосам ровно к закату." },
  { guide: 3, traveler: 0, listing: 2, rating: 4, title: "Горы и море за день — реально", body: "Плотный, но не изматывающий день. Сунил всё рассчитал по минутам, успели и в Поляну, и к морю." },
];

async function findUserByEmail(email) {
  const { data, error } = await supa.auth.admin.listUsers({ page: 1, perPage: 500 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function upsertAccount({ email, fullName, role, phone }) {
  const existing = await findUserByEmail(email);
  let userId;
  if (existing) {
    const { data, error } = await supa.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (error) throw new Error(`updateUserById ${email}: ${error.message}`);
    userId = data.user.id;
  } else {
    const { data, error } = await supa.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    userId = data.user.id;
  }
  const { error: pErr } = await supa
    .from("profiles")
    .upsert({ id: userId, email, full_name: fullName, role, phone: phone ?? null, account_status: "active" }, { onConflict: "id" });
  if (pErr) throw new Error(`profiles ${email}: ${pErr.message}`);
  const { error: mErr } = await supa.auth.admin.updateUserById(userId, { app_metadata: { role } });
  if (mErr) throw new Error(`app_metadata ${email}: ${mErr.message}`);
  return userId;
}

const guideIds = [];
for (const g of GUIDES) {
  const id = await upsertAccount({ email: g.email, fullName: g.fullName, role: "guide", phone: g.phone });
  guideIds.push(id);
  const { error } = await supa.from("guide_profiles").upsert(
    {
      user_id: id,
      slug: g.slug,
      display_name: g.displayName,
      base_city: g.baseCity,
      regions: g.regions,
      bio: g.bio,
      years_experience: g.years,
      rating: g.rating,
      average_rating: g.rating,
      completed_tours: g.tours,
      languages: ["Русский"],
      specialties: ["Культура", "Природа"],
      specializations: ["history_culture", "nature"],
      verification_status: "approved",
      is_available: true,
    },
    { onConflict: "user_id" },
  );
  if (error) throw new Error(`guide_profiles ${g.slug}: ${error.message}`);
  console.error(`[guide] ${g.slug} ${g.phone ? "" : "(no phone — item 18 fixture)"}`);
}

const travelerIds = [];
for (const t of TRAVELERS) {
  travelerIds.push(await upsertAccount({ email: t.email, fullName: t.fullName, role: "traveler" }));
  console.error(`[traveler] ${t.fullName}`);
}

const listingIds = [];
for (const l of LISTINGS) {
  const { data, error } = await supa
    .from("listings")
    .upsert(
      {
        guide_id: guideIds[l.guide],
        slug: l.slug,
        title: l.title,
        city: l.city,
        region: l.region,
        category: "excursion",
        route_summary: l.summary,
        description: `${l.summary} Маршрут авторский, группа небольшая, темп спокойный.`,
        duration_minutes: l.duration,
        max_group_size: l.group,
        price_from_minor: l.price,
        format: l.format,
        currency: "RUB",
        private_available: l.format !== "group",
        group_available: l.format !== "private",
        instant_book: false,
        inclusions: ["Сопровождение гида", "Входные билеты"],
        exclusions: ["Питание", "Трансфер"],
        cancellation_policy_key: "flexible",
        status: l.status,
        featured_rank: l.rank,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (error) throw new Error(`listings ${l.slug}: ${error.message}`);
  listingIds.push(data.id);
  console.error(`[listing] ${l.slug} → ${l.status}`);
}

// Reviews/bookings/requests have no natural key to upsert on, so re-running the
// script would stack duplicates. Clear this fixture's rows first — scoped strictly
// to the fixture accounts, nothing else is touched.
await supa.from("reviews").delete().in("guide_id", guideIds);
await supa.from("bookings").delete().in("guide_id", guideIds);
await supa.from("traveler_requests").delete().in("traveler_id", travelerIds);

// reviews.booking_id is NOT NULL, so every review needs a completed booking behind it.
for (const [i, r] of REVIEWS.entries()) {
  const { data: booking, error: bErr } = await supa
    .from("bookings")
    .insert({
      traveler_id: travelerIds[r.traveler],
      guide_id: guideIds[r.guide],
      listing_id: listingIds[r.listing],
      status: "completed",
      party_size: 2,
      subtotal_minor: 900000,
      deposit_minor: 180000,
      remainder_minor: 720000,
      currency: "RUB",
      cancellation_policy_snapshot: { key: "flexible" },
      payment_method: "in_person",
      payment_status: "paid",
      starts_at: new Date(Date.now() - (30 + i) * 86400_000).toISOString(),
      ends_at: new Date(Date.now() - (30 + i) * 86400_000 + 6 * 3600_000).toISOString(),
    })
    .select("id")
    .single();
  if (bErr) throw new Error(`bookings #${i}: ${bErr.message}`);

  const { error: rErr } = await supa.from("reviews").insert({
    booking_id: booking.id,
    traveler_id: travelerIds[r.traveler],
    guide_id: guideIds[r.guide],
    listing_id: listingIds[r.listing],
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: "published",
    would_recommend: true,
  });
  if (rErr) throw new Error(`reviews #${i}: ${rErr.message}`);
  console.error(`[review] ${r.title}`);
}

const in14 = new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10);
const in16 = new Date(Date.now() + 16 * 86400_000).toISOString().slice(0, 10);
const { error: reqErr } = await supa.from("traveler_requests").insert({
  traveler_id: travelerIds[0],
  destination: "Элиста",
  region: "Калмыкия",
  interests: ["Культура", "Гастрономия"],
  starts_on: in14,
  ends_on: in16,
  // ~1 000 ₽/чел: the homepage renders this as «1 000 ₽ / чел», and the old
  // 5 000 ₽ read as an unrealistic asking price for a demo open group.
  budget_minor: 100000,
  currency: "RUB",
  participants_count: 3,
  notes: "Хотим степь, хурул и калмыцкую кухню. Двое взрослых и подросток, темп спокойный.",
  open_to_join: true,
  group_capacity: 6,
  allow_guide_suggestions: true,
  status: "open",
  date_flexibility: "few_days",
  requested_languages: ["Русский"],
});
if (reqErr) throw new Error(`traveler_requests: ${reqErr.message}`);
console.error("[request] Элиста / 3 участника");

console.log(
  JSON.stringify(
    {
      guides: GUIDES.map((g, i) => ({ slug: g.slug, id: guideIds[i], hasPhone: Boolean(g.phone) })),
      travelers: TRAVELERS.map((t, i) => ({ name: t.fullName, id: travelerIds[i] })),
      listings: LISTINGS.map((l, i) => ({ slug: l.slug, id: listingIds[i], status: l.status })),
      reviews: REVIEWS.length,
    },
    null,
    2,
  ),
);
