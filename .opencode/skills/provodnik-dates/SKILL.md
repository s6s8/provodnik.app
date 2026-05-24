---
name: provodnik-dates
description: Use ONLY when computing a calendar date (YYYY-MM-DD form) in apps/provodnik/code — any call to new Date().toISOString().slice(0,10), date input min/max attributes, default form date values, anything timezone-sensitive. Covers AP-010 — TZ-naive ISO dates cause SSR/CSR hydration mismatch; use todayMoscowISODate from src/lib/dates.ts.
---

# Calendar dates in provodnik MUST use Moscow timezone

### AP-010 — TZ-naive calendar dates (server/client divergence)
**Never** compute a calendar date with `new Date().toISOString().slice(0,10)`. It's UTC-anchored; SSR (UTC container) and CSR in MSK diverge near midnight UTC → hydration mismatch + "yesterday" as min date.
**Always** pin TZ: `Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' }).format(new Date())`. Use the single helper `todayMoscowISODate` in `src/lib/dates.ts`.

```ts
// CORRECT
import { todayMoscowISODate } from '@/lib/dates';
const today = todayMoscowISODate();

// WRONG — UTC-anchored; SSR (UTC) and CSR (MSK) diverge near midnight UTC
const today = new Date().toISOString().slice(0, 10);
```