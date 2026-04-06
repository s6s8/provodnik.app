# ANTI_PATTERNS.md — Failure Blacklist

_Things tried and failed. Subagents must not repeat these. Format: AP-NNN_

---

### AP-001: Using slug directly in ilike data column queries
- **What was tried:** `getListingsByDestination` queried `.or('city.ilike.%kazan-tatarstan%')` using the URL slug directly
- **Why it failed:** The `city` column contains Russian text ('Казань'), not the URL slug. ilike match fails → 0 results returned.
- **Correct approach:** Always resolve slug → destination record first (`select name, region where slug = ?`), then use the actual name/region values in the data query.

### AP-002: Storing image URLs inside text/description columns as JSON
- **What was tried:** `description` field contains plain Russian text. `parseImageFromJson(description)` always throws, falls back to mountain photo.
- **Why it failed:** Description is human text, not JSON. Parsing always fails.
- **Correct approach:** Use a dedicated `image_url` column for image URLs.

### AP-003: Using HTML `required` attribute on inputs with custom JS validation
- **What was tried:** Auth form inputs had `required` HTML attributes alongside JS `handleSubmit` validation
- **Why it failed:** Browser's native validation runs before JS handler — shows browser tooltip instead of styled error UI
- **Correct approach:** Remove `required` from inputs. Rely entirely on JS validation which shows the styled red error box.

### AP-005: Creating git worktrees in the parent workspace repo
- **What was tried:** `git worktree add /mnt/rhhd/projects/provodnik/.claude/worktrees/feat-X` — created worktrees in the PARENT repo
- **Why it failed:** The parent repo at `/mnt/rhhd/projects/provodnik/` contains only docs and workspace files. `provodnik.app/` is a SEPARATE git repo. Worktrees from parent contain no `src/` tree.
- **Correct approach:** All git ops for the app must use `git -C /mnt/rhhd/projects/provodnik/provodnik.app`. Worktrees must be created in provodnik.app, not the parent.

### AP-004: Seed listings assigned to wrong guide_id
- **What was tried:** Test guide account (guide@provodnik.test, ID: 30000000-...-001) had no seed listings because all listings used seed guide IDs (10000000-...-101, 10000000-...-102)
- **Why it failed:** Login as test guide → empty listings page, misleading for QA
- **Correct approach:** Ensure test accounts have corresponding seed data. When adding listings, verify guide_id matches a real test account UUID.
