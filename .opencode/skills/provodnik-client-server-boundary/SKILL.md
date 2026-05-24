---
name: provodnik-client-server-boundary
description: Use ONLY when adding 'use client' files in apps/provodnik/code, or when importing between client and server modules (anything in src/lib/supabase/, src/lib/auth/, files using next/headers, server actions). Covers AP-014/ERR-034/036 — never import a value from a server-only module into a 'use client' file; split shared constants/types into *-types.ts.
---

# Client/server import boundary in provodnik

### AP-014 / ERR-034 / ERR-036 — Client/server import boundary
**Never** import an async server component, or any **value** (not just type) from a server-only module, into a `'use client'` file. A single value import pulls the whole transitive module — including `next/headers` → 5-deploy Turbopack failure streak.
**Always** split shared constants/types into `*-types.ts` with zero server imports. Client imports from `*-types.ts`; server module imports + re-exports from `*-types.ts`. Pattern: `qa-threads-types.ts` (client-safe) + `qa-threads.ts` (server-only).

```ts
// CORRECT — *-types.ts pattern
// qa-threads-types.ts (client-safe, zero server imports)
export type QaThreadStatus = 'open' | 'closed';
export const QA_THREAD_STATUSES = ['open', 'closed'] as const;

// qa-threads.ts (server-only)
import 'server-only';
import { QA_THREAD_STATUSES, type QaThreadStatus } from './qa-threads-types';
export { QA_THREAD_STATUSES, type QaThreadStatus };
export async function fetchThreads() { /* uses next/headers */ }

// WRONG — pulls next/headers into the client bundle, breaks Turbopack
// my-client.tsx
'use client';
import { fetchThreads } from '@/features/qa/qa-threads';
```