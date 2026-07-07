# Opus task packet — P0 public guide catalog visibility

You are QuantumHands working in `/Users/idev/provodnik`.

## Mission
Fix the production blocker: `https://vps.provodnik.app/guides` still does not show approved guides, so owner cannot verify multiple open-task rows.

Analyze first. Do not guess. Determine whether the failure is code, production DB data/migration, stale VPS deploy, cache/revalidation, or public RPC/search predicate drift. Then fix the smallest safe root cause and verify live.

## Required context to read first
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/CLAUDE.md`
- relevant SOT: `.claude/sot/INDEX.md`, `.claude/sot/ERRORS.md`, `.claude/sot/ANTI_PATTERNS.md`
- `src/data/supabase/queries.ts`
- `src/app/(site)/guides/**` if present
- `src/app/(protected)/admin/guides/**`
- migrations/RPC/view files touching `search_guides`, `v_guide_public_profile`, `guide_profiles`, guide approval, public catalog
- previous QA evidence under `docs/qa/open-tasks-20260706/` and `docs/qa/excel-finish-20260706/` if available on the active branch/worktree

## Hard rules
- Use Superpowers, Ponytail, and Context7. In final report, state how each affected the work.
- Before any DB work, confirm this is Provodnik Supabase ref `yjzpshutgmhxizosbeef`, not DataRaven.
- Do not print secrets, raw tokens, raw personal data, or full private contact dumps.
- Do not run blind destructive DB commands.
- Prefer read-only DB probes first.
- If production DB data/backfill is needed, make it targeted, idempotent, and reversible or additive. Record before/after counts without exposing PII.
- If current root worktree has unrelated dirty files, create/use a clean `origin/main` worktree and commit only intended files.
- Do not include automation attribution trailers in commits.

## Visibility predicates to prove
Approved guides must appear publicly when:
- `guide_profiles.verification_status = 'approved'`
- `guide_profiles.is_available = true`
- `guide_profiles.slug` is non-empty/stable
- public guide search/list does NOT require published listings unless product explicitly decides so
- public guide detail resolves the same slug shape that cards link to, including Cyrillic/encoded slugs
- `/guides`, `/guides?q=...`, `/guides/<slug>` are revalidated/served by current VPS commit

## Investigation checklist
1. Git/deploy state:
   - local branch/HEAD/status
   - `origin/main` HEAD
   - VPS `/opt/provodnik` HEAD/status
   - `provodnik.service` active
   - Caddy active
2. Live behavior:
   - curl/browser `https://vps.provodnik.app/guides`
   - inspect body for real guide card/name, not HTTP 200 only
   - try query search for a known approved guide name if available
3. Production DB read-only probes:
   - count approved guides
   - count approved + available + slug non-empty
   - sanitized list of public candidate names/slugs only
   - RPC/search equivalent with `p_has_listings=false`
   - compare RPC results with raw candidate rows
4. Code path analysis:
   - public guide page/query helper
   - `search_guides` RPC args/definition
   - `v_guide_public_profile`
   - admin approval path/backfill migrations
   - cache/revalidation paths
5. State root cause explicitly before editing.

## Fix scope
Possible fixes, depending on proven root cause:
- Patch admin approval so approve sets `verification_status='approved'`, `is_available=true`, and generated slug when missing.
- Add idempotent migration/backfill for already-approved guides with missing `is_available`/slug.
- Patch public guide query/RPC to use `p_has_listings=false` and include approved/available guides before first listing.
- Patch detail lookup slug normalization/decoding if cards link but detail fails.
- Sync/rebuild/restart VPS if code is fixed but VPS stale.

## Required verification
Local/repo:
- targeted tests around public guide discovery/search and approval/backfill if code changed
- `bun run typecheck`
- `bun run lint`
- `bun run build` if Next route/data behavior changed

Remote/live:
- GitHub `origin/main` contains the fix commit/merge
- VPS `/opt/provodnik` matches `origin/main`
- `systemctl is-active provodnik.service` => active
- `systemctl is-active caddy` => active
- `https://vps.provodnik.app/guides` body visibly contains at least one approved guide/card
- `https://vps.provodnik.app/guides?q=<known guide>` shows the target guide
- `https://vps.provodnik.app/guides/<slug>` shows a guide profile body/H1 and not `Страница не найдена`

## Deliverables
Write/update:
- `docs/qa/guide-catalog-visibility-opus-20260707/REPORT.md`

Final report must include:
1. Root cause, proven with evidence.
2. Files/migrations changed.
3. DB action taken, if any, with sanitized before/after counts.
4. Test/check results.
5. Commit/PR/merge/deploy status.
6. Live proof bullets.
7. Remaining blockers, if any.
8. Short sanitized Russian owner update with ✅ bullets.

## Done condition
Do not stop until either:
- `/guides` on VPS visibly lists approved guides and guide detail opens correctly, with proof in `REPORT.md`; or
- a concrete external blocker is proven with exact next action.
