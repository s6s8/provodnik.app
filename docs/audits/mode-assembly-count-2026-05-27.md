# mode=assembly legacy count — prod audit

**Date:** 2026-05-27  
**Auditor:** provodnik-implement worker (Wave 3, item C1)  
**Query:** `SELECT count(*) FROM traveler_requests WHERE open_to_join = true`  
**Source:** PostgREST HEAD `Content-Range` — read-only, no writes performed

---

## Result

**count = 7**

---

## Records

| id | traveler_id | destination | status | created_at | notes |
|----|------------|-------------|--------|------------|-------|
| c36ac99e | faf19976 | Астрахань | open | 2026-05-20T10:18:06Z | Типа того |
| be3f3683 | 1bc71bcf | Москва | expired | 2026-04-22T02:46:18Z | — |
| 860b2a13 | faf19976 | Мурманск | open | 2026-05-20T12:06:51Z | — |
| c0bede22 | 1bc71bcf | Сочи | expired | 2026-04-22T18:45:25Z | — |
| 2d18faf2 | bac57c7f | Казань | open | 2026-05-19T06:56:27Z | Хотим эшкере |
| cee16cbc | faf19976 | Уфа | open | 2026-05-20T09:18:24Z | от заката до рассвета |
| fd4ec195 | faf19976 | Астрахань | open | 2026-05-20T10:17:55Z | Типа того |

---

## Traveler account analysis

| traveler_id (short) | full_name | email | verdict |
|---|---|---|---|
| faf19976 | Айбилив Айканфлаэв | balihog176@itquoted.com | **test** — disposable email domain (`itquoted.com`), gibberish name |
| bac57c7f | Петров Петр | sesiyo8868@dardr.com | **test** — disposable email domain (`dardr.com`), canonical test name |
| 1bc71bcf | Dev | dev+guide@rgx.ge | **test** — developer's own seed account |

---

## Verdict: ALL 7 RECORDS ARE TEST DATA

No real-user assembly-mode requests exist in prod.

**Panel rule applied:** "treat as test data unless real-user" — all three traveler accounts are unambiguously test/seed accounts.  
No data cleanup action required. Records may remain or be purged at operator discretion.

---

## Schema note

The application layer (`queries.ts:377`) computes `mode='assembly'` from the DB column `open_to_join = true` in `public.traveler_requests`. There is **no `mode` column** in the database — the field is a virtual/derived property exposed only through the TypeScript type `RequestRecord`. Any future DB-level query for "assembly" records must use `WHERE open_to_join = true`.
