# Provodnik Repo Hygiene + Cleanup Plan

> Purpose: keep `/Users/idev/provodnik` clean without losing product evidence, design references, or SOT history.
>
> Source: Claude Code read-only audit, corrected by Hermes verification against `git ls-files`, `.gitignore`, and live repo status.

## Current state summary

- Repo branch at audit time: `handover/macmini-final`, ahead of `origin/main` by 1 commit.
- Root has significant visual/test artifact clutter.
- Important correction: most root PNGs are **tracked**, not disposable ignored files. Do **not** `rm *.png` blindly.
- `.gitignore` already blocks future root PNGs via `/*.png`, but tracked PNGs remain in git until explicitly moved or removed with `git mv`/`git rm`.
- `node_modules/`, `.next/`, `.vercel/`, `.playwright-mcp/`, `test-results/`, `tsconfig.tsbuildinfo`, `next-env.d.ts`, `.env.local`, `.qbk/`, and `.claude/prompts/out/` are ignored local artifacts.

## Classification

### Keep at root

| Path | Why |
|---|---|
| `CLAUDE.md` | Claude entry point |
| `AGENTS.md` | Stack/module/verification reference |
| `README.md` | Human project overview |
| `package.json`, `bun.lock` | Package source of truth |
| `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `vitest.config.mts`, `playwright*.config.ts` | Tooling config |
| `components.json` | shadcn/ui config |
| `.env.example` | safe env template |
| `sentry.edge.config.ts`, `sentry.server.config.ts` | runtime config |

### Move out of root, preserve in docs

Competitive research docs:

```text
airbnb-exp.md
getyourguide-home.md
sputnik8-home.md
tripster-home.md
viator-home.md
```

Recommended destination:

```text
docs/product/research/competitive/
```

Tracked root screenshots/design evidence:

```text
after-click-flex.png
before-click-test.png
bundle-themes-up-1280.png
bundle-themes-up-375.png
date-time-fixed.png
flex-after.png
flex-before.png
flex-button-test.png
flex-deployed-after.png
flex-desktop-click-test.png
form-after-click.png
form-desktop-current.png
form-fixed.png
form-full-section.png
form-mobile-state.png
groupsize-fixed.png
homepage-full-1280.png
homepage-full-375.png
mobile-after-click.png
mobile-form.png
reqcards-1280.png
reqcards-2var-1280.png
reqcards-2var-375.png
reqcards-4fixes-1280.png
reqcards-4fixes-375.png
reqcards-v1-375.png
themes-fixed.png
themes-section.png
vA-1280.png
vA-375.png
vA2-1280.png
vA2-375.png
viator-home.png
```

Recommended destination:

```text
docs/qa/screenshots/root-archive/
```

Large untracked root PNGs can be archived or deleted after backup:

```text
counter-offer-latest.png
join-group-feature.png
mockup-counter-offer-2026-06-10.png
request-detail-full.png
```

Recommended backup before delete:

```text
/Users/idev/provodnik-cleanup-backup-<timestamp>/root-png-local/
```

### Review before touching

| Path | Decision needed |
|---|---|
| `DECISIONS.md` | keep as root pointer or delete in favor of `.claude/sot/DECISIONS.md` |
| `audits/2026-05-12-ppfs-stage1/` | move to `docs/audits/2026-05-12-ppfs-stage1/` after reference check |
| `.design-sync/compiled.css`, `.design-sync/ds-styles.css` | keep if canonical; gitignore/remove from git if generated |
| `.claude/prompts/_qh-*.md`, `.claude/prompts/tripster-v1/`, `.claude/prompts/overnight-*` | active dispatch references or historical archive? |
| `.claude/refactor/` | active campaign or archive? |
| `docs/_stale/` | keep as stale marker or archive out of repo |

### Never delete casually

```text
src/
supabase/migrations/
supabase/rollbacks/
supabase/tests/
.claude/sot/
.claude/checklists/
.claude/prompts/skeleton.md
public/
scripts/
docs/product/
docs/architecture/
docs/design/
docs/design-canon/
```

## Safe cleanup protocol

### 1. Snapshot first

```bash
cd /Users/idev/provodnik
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP="/Users/idev/provodnik-cleanup-backup-$STAMP"
mkdir -p "$BACKUP"
git status --short --branch > "$BACKUP/git-status-before.txt"
git ls-files > "$BACKUP/git-ls-files-before.txt"
```

### 2. Move tracked root docs and screenshots, do not delete them

```bash
mkdir -p docs/product/research/competitive docs/qa/screenshots/root-archive

git mv airbnb-exp.md getyourguide-home.md sputnik8-home.md tripster-home.md viator-home.md \
  docs/product/research/competitive/

git mv after-click-flex.png before-click-test.png bundle-themes-up-1280.png bundle-themes-up-375.png \
  date-time-fixed.png flex-after.png flex-before.png flex-button-test.png flex-deployed-after.png \
  flex-desktop-click-test.png form-after-click.png form-desktop-current.png form-fixed.png \
  form-full-section.png form-mobile-state.png groupsize-fixed.png homepage-full-1280.png \
  homepage-full-375.png mobile-after-click.png mobile-form.png reqcards-1280.png \
  reqcards-2var-1280.png reqcards-2var-375.png reqcards-4fixes-1280.png \
  reqcards-4fixes-375.png reqcards-v1-375.png themes-fixed.png themes-section.png \
  vA-1280.png vA-375.png vA2-1280.png vA2-375.png viator-home.png \
  docs/qa/screenshots/root-archive/
```

### 3. Backup then remove ignored local root PNGs

```bash
mkdir -p "$BACKUP/root-png-local"
for f in counter-offer-latest.png join-group-feature.png mockup-counter-offer-2026-06-10.png request-detail-full.png; do
  [ -f "$f" ] && mv "$f" "$BACKUP/root-png-local/"
done
```

### 4. Remove duplicate untracked docs only after confirming duplicates exist

```bash
cmp -s docs/audits/2026-04-14-audit-findings.md docs/qa/2026-04-14-audit-findings.md && rm docs/audits/2026-04-14-audit-findings.md
cmp -s docs/audits/2026-04-14-audit-plan.md docs/qa/2026-04-14-audit-plan.md && rm docs/audits/2026-04-14-audit-plan.md
cmp -s docs/audits/2026-05-10-e2e-spec-rot-fix.md docs/qa/2026-05-10-e2e-spec-rot-fix.md && rm docs/audits/2026-05-10-e2e-spec-rot-fix.md
```

### 5. Verify

```bash
git status --short
git diff --check
bun run typecheck
bun run lint
```

For docs-only moves, `typecheck`/`lint` should remain unchanged. For any product-code cleanup, run full gate:

```bash
bun run typecheck && bun run lint && bun run test:run && bun run build
```

## Ongoing cleanliness rules

1. No new screenshots at repo root. Put durable screenshots in `docs/qa/screenshots/<topic>/`; leave temporary screenshots outside the repo or under ignored backup folders.
2. No competitive/product research at root. Use `docs/product/research/`.
3. No one-off audits at root. Use `docs/audits/`.
4. Generated build/cache output must stay ignored.
5. Before committing, run:

```bash
git status --short
git diff --check
```

6. If cleanup includes code or config, run `bun run typecheck && bun run lint` at minimum.
