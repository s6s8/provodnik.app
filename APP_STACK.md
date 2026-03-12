# App Stack Recommendation: Provodnik

## 1. Final recommendation

For `Provodnik`, the best stack is:

- `Next.js` App Router
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui`
- `Motion`
- `Supabase`
- `TanStack Query`
- `React Hook Form` + `Zod`
- `Vercel`
- `Playwright`
- `YooKassa`
- `Yandex Maps`
- optional `Telegram Mini App` wrapper for distribution

This should be built as a `web-first, mobile-first marketplace`, not a native-first mobile app.

## 2. Why this is the right stack

Your product is not just a consumer app. It is a marketplace with:

- SEO-sensitive pages;
- landing pages for regions, tours, and guides;
- logged-in traveler flows;
- logged-in guide flows;
- admin and moderation tools;
- payments;
- reviews;
- trust and compliance workflows;
- high mobile usage.

That combination strongly favors a modern full-stack web platform first.

Starting native-first would slow down:

- launch speed;
- iteration speed;
- SEO acquisition;
- content indexing;
- admin tooling;
- partner onboarding.

So the correct move is:

- phase 1: `mobile-first web app`;
- phase 1.5: `Telegram Mini App` if distribution there matters;
- phase 2: `Expo` native app only if retention and usage justify it.

## 3. Core stack

### Frontend framework

- `Next.js` App Router
- `React`
- `TypeScript`

Why:

- excellent fit for marketplaces and hybrid apps;
- first-class routing, layouts, metadata, images, fonts, and server rendering;
- strong support for forms, server actions, route handlers, caching, and revalidation;
- deploys cleanly on Vercel.

Use it for:

- marketing pages;
- guide pages;
- tour pages;
- traveler account;
- guide dashboard;
- admin panel;
- booking flow.

## 4. UI stack

### Styling

- `Tailwind CSS`

Why:

- fastest way to ship consistent product UI;
- excellent responsive and state styling;
- ideal for design tokens, spacing discipline, and mobile-first development.

### Components

- `shadcn/ui`

Why:

- accessible, well-designed building blocks;
- full code ownership instead of opaque package abstractions;
- easy to customize into your own design system;
- much better long-term fit than locking yourself into a rigid component library.

### Motion

- `Motion`

Why:

- smooth, production-grade UI animation;
- good touch interactions;
- useful for sheet transitions, page transitions, drawer behavior, map/list transitions, and mobile gesture polish.

## 5. Data and backend

### Backend platform

- `Supabase`

Use:

- `Postgres`
- `Auth`
- `Storage`
- `Realtime`
- `Row Level Security`

Why:

- fast setup;
- strong fit for marketplace CRUD and auth;
- excellent for user accounts, roles, bookings, chat-like updates, uploads, and moderation assets;
- easier to move fast with than building your own backend stack from zero.

Recommended posture:

- use `Supabase` as the core backend;
- keep schema disciplined from day one;
- treat RLS and roles as product infrastructure, not as an afterthought.

## 6. Client data and forms

### Server state

- `TanStack Query`

Why:

- excellent for async server state;
- good cache handling, invalidation, pagination, retries, optimistic updates, and mobile-friendly data behavior.

### Forms

- `React Hook Form`
- `Zod`

Why:

- fast and scalable forms;
- type-safe validation;
- ideal for booking forms, guide onboarding, moderation forms, payout forms, and traveler requests.

## 7. Hosting and deployment

### Hosting

- `Vercel`

Why:

- best deployment path for `Next.js`;
- zero-friction previews;
- good global performance;
- simple rollback and preview workflow;
- fast team iteration.

Recommended usage:

- web app on `Vercel`;
- database and auth on `Supabase`;
- storage depending on fit:
  - `Supabase Storage` for user uploads and product assets;
  - optionally `Vercel Blob` later for specific use cases.

## 8. Russia-specific product infrastructure

### Payments

- `YooKassa`

Why:

- practical fit for Russian market payment methods and flows;
- supports cards, SberPay, SBP, T-Pay, and related integrations.

### Maps

- `Yandex Maps`

Why:

- better regional fit than defaulting to Google Maps;
- relevant for routes, meeting points, local discovery, pickup locations, and map-based tour UX in Russia.

### Distribution

- optional `Telegram Mini App`

Why:

- your market already lives partly in Telegram;
- mini apps are web-based and can improve acquisition without forcing a native app build;
- useful as an extra funnel for leads, quick booking, and group assembly.

## 9. Testing and quality

### End-to-end testing

- `Playwright`

Why:

- strong for modern web apps;
- supports mobile emulation;
- ideal for booking, login, payment handoff, cancellation, and dashboard smoke tests.

Recommended minimum:

- auth flow;
- traveler request flow;
- booking flow;
- guide response flow;
- cancellation/refund flow;
- admin moderation smoke test.

## 10. UX/UI direction

Your product should be:

- mobile-first;
- thumb-friendly;
- fast-loading;
- calm, clean, and premium;
- highly legible;
- resilient on poor connections.

Design rules for this stack:

- use large tap targets;
- use bottom sheets and drawers on mobile;
- keep forms short and progressive;
- minimize modal overload;
- keep map usage optional, not blocking;
- prioritize list-first mobile browsing with strong filters;
- use motion sparingly and purposefully;
- build a strong design token system early.

## 11. What I recommend you do not use at stage 1

Do not start with:

- `Expo` as the primary product surface;
- a separate custom backend from scratch;
- a heavy enterprise component library;
- a CSS-in-JS stack;
- over-engineered microservices;
- GraphQL unless a specific team constraint requires it.

Why:

- all of these add complexity too early;
- none of them is the main leverage for proving this marketplace.

## 12. Recommended architecture in one line

`Next.js + TypeScript + Tailwind + shadcn/ui + Motion + Supabase + TanStack Query + React Hook Form + Zod + Vercel + Playwright + YooKassa + Yandex Maps`

## 13. Phase plan

### Phase 1

Build:

- mobile-first web app;
- traveler flow;
- guide flow;
- admin;
- payments;
- reviews;
- moderation;
- request and group mechanics.

### Phase 1.5

Add:

- `Telegram Mini App` wrapper for acquisition and light booking flows.

### Phase 2

Only if justified by retention:

- `Expo` app for native shell, push-heavy flows, and deep mobile engagement.

## 14. Bottom line

If you want the strongest modern stack for this product, do this:

- build a `Next.js` mobile-first web app;
- style it with `Tailwind CSS` and `shadcn/ui`;
- add polish with `Motion`;
- run backend on `Supabase`;
- deploy on `Vercel`;
- integrate `YooKassa` and `Yandex Maps`;
- use `Telegram Mini App` as an optional distribution layer;
- delay `Expo` until the business proves native is worth the cost.

That is the most robust, modern, clean, and usability-first stack for `Provodnik` right now.

## 15. Sources

- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS with Next.js: https://tailwindcss.com/docs/installation/framework-guides/nextjs
- shadcn/ui docs: https://ui.shadcn.com/docs
- Next.js on Vercel: https://vercel.com/docs/frameworks/full-stack/nextjs
- Supabase with Next.js: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Motion for React: https://motion.dev/docs/react
- Zod docs: https://zod.dev/
- TanStack Query React docs: https://tanstack.com/query/latest/docs/framework/react/overview
- Playwright docs: https://playwright.dev/docs/intro
- Expo docs: https://docs.expo.dev/
- YooKassa API docs: https://yookassa.ru/developers
- Yandex Maps JS API: https://yandex.com/maps-api/docs/js-api/index.html
- Telegram Mini Apps docs: https://docs.telegram-mini-apps.com/
- Telegram Mini Apps update overview: https://telegram.org/blog/fullscreen-miniapps-and-more
