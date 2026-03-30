---
name: fetch-docs
description: Fetch live documentation via Context7 before coding against any library API — Next.js, Supabase, TanStack Query, Tailwind, Zod, shadcn
---

# Fetch Docs Before Coding

Use when: about to write code that calls a library API you are not 100% certain about.

**Rule: never guess. Context7 takes 10 seconds. A wrong API wastes hours.**

## Step 1 — Resolve library ID

Use the `mcp__plugin_context7_context7__resolve-library-id` tool with the library name.

| Library | Search term |
|---|---|
| Next.js 16 | `nextjs` |
| Supabase JS | `supabase` |
| @supabase/ssr | `supabase ssr` |
| Supabase Realtime | `supabase realtime` |
| TanStack Query v5 | `tanstack query` |
| Tailwind CSS v4 | `tailwindcss` |
| shadcn/ui | `shadcn` |
| Zod v4 | `zod` |
| React 19 | `react` |

## Step 2 — Fetch the relevant section

Use `mcp__plugin_context7_context7__query-docs` with:
- The resolved library ID
- A focused topic query (e.g. "middleware session refresh", "realtime broadcast", "server component data fetching")

## Step 3 — Then write the code

Use only APIs confirmed in the fetched docs. If the API isn't in the docs, don't use it.

## When this is required (always)

- Any Supabase auth call (`createBrowserClient`, `createServerClient`, session handling)
- Any Supabase Realtime subscription
- Any Next.js middleware pattern
- Any TanStack Query v5 pattern (`useQuery`, `useMutation`, `prefetchQuery`)
- Any Tailwind v4 utility that might have changed from v3
- Any Zod v4 schema API (breaking changes from v3)
- Any React 19 server action or use() hook
