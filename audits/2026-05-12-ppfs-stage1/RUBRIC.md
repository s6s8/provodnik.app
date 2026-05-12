# PPFS Stage 2 — fix-queue rubric (tier taxonomy)

This rubric maps Stage 1 audit **criticality** (see `LEGEND.md`) and rollout context into a **four-tier fix queue** (`P0`–`P3`) for joint review with the owner. Queue tier is not identical to audit criticality labels: audit may say `P1` while queue tier stays `P3` when the item is explicitly deferred by epic sequence (cosmetic / tech-debt bucket).

## (1) Tier definitions

| Tier | Name | When to use | Typical time horizon |
| --- | --- | --- | --- |
| `P0` | Blocker | Primary persona flow or audit operability is impossible; security boundary unclear and cannot be verified; data corruption or wrong-money class defects with no safe workaround. | Before any further role passes or release |
| `P1` | High | Serious degradation: wrong or misleading user-visible data, broken secondary path with user harm, inconsistent models that will silently drop data in downstream filters, or open abuse vector tied to agreed epic scope. | Next sprint slice after `P0` |
| `P2` | Medium | Minor defects with clear workaround; silent error states; stub-vs-reality drift; deferred coverage waiting on seed data only after credentials exist. | After `P1` unless unblocker |
| `P3` | Deferred | Cosmetic-only, doc nits, PASS rows kept for traceability, epic-explicit backlog (К1–К3), or any item epic has ordered **after** the functional contour. | Post–functional-contour per epic |

## (2) Mapping table — criticality × role × epic position → queue tier

Interpret **affected role** as who hits the symptom first; interpret **epic position** relative to the agreed sequence (PPFS functional contour → anti-disintermediation → transactions → …).

| Audit criticality | Affected role(s) | Epic position (vs PPFS / functional contour) | Default queue tier | Notes |
| --- | --- | --- | --- | --- |
| `P0` (audit) | Any | Still inside PPFS / blocks PPFS completion | `P0` | Example: cannot log in with documented seeds → blocks guide/admin passes. |
| `P0` (audit) | Any | Outside PPFS but security / money / data loss | `P0` | Escalate immediately; do not downgrade without owner sign-off. |
| `P1` | guest, traveler | Inside PPFS; encodes user-visible wrong data or model fork | `P1` | Example: UTF-8 mojibake; home vs kabinet request form divergence. |
| `P1` | guide, admin | Walk blocked only by credentials / seed on live | `P0` for **unblock**, then re-tier findings after re-walk | Treat credential mismatch as queue `P0` until resolved; deferred route rows stay `P3` until walked. |
| `P2` | Any | Inside PPFS | `P2` | |
| `Cosmetic` | Any | Inside PPFS; not in pinned К-list | `P3` | Never auto-promote without product call. |
| `—` (stub / deferred / PASS) | Any | Registry row not yet exercised | `P3` | Traceability only until re-run. |
| Any | Any | Epic explicitly deferred item (К1–К3, К4–К5 carry-overs per plan) | Per epic rule | К4/К5 excluded from PPFS queue; К1–К3 forced `P3` (see below). |

## (3) Pinned items — cosmetic / tech-debt → `P3` regardless of audit criticality

The following backlog tags from the epic plan are **pinned to queue tier `P3` even if** a narrow reading of audit text might suggest a higher tier. Raising them requires an explicit owner decision (and triggers the concern annotation in `QUEUE.md`).

| Tag | Meaning |
| --- | --- |
| **К1** | Служебный словарь интересов / interest taxonomy tech debt (align home vs kabinet chips after functional contour). |
| **К2.1** | Юнит-тесты на устаревших селекторах (subset 1). |
| **К2.2** | Юнит-тесты на устаревших селекторах (subset 2). |
| **К2.3** | Юнит-тесты на устаревших селекторах (subset 3). |
| **К3** | Информационные предупреждения линтера (cleanup after functional contour). |

**Rule:** If any of К1–К3 were assigned a queue tier above `P3`, the author must add `CONCERN: cosmetic escalation attempt` in `QUEUE.md` for that row. (К4 and К5 are handled as **excluded** rows in `QUEUE.md`, not tiered.)

## Cross-reference

- Registry tables: `guest.md`, `traveler.md`, `guide.md`, `admin.md`
- Prioritized queue: `QUEUE.md`
