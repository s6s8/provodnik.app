# Provodnik Orchestration Rules for Claude

These rules are loaded for Claude Code sessions in this repo.

## First read

Before non-trivial work, read:

1. `CLAUDE.md`
2. `.claude/CLAUDE.md`
3. `AGENTS.md`
4. `.claude/sot/HOT.md`
5. `.claude/sot/INDEX.md`
6. relevant SOT/source files

## Control surface

- Hermes/Quantumbek coordinates, plans, reviews, and verifies.
- QuantumHands is the default product-code executor.
- Claude Code is used for analysis, plans, reviews, runbooks, and explicitly authorized bounded execution.
- Do not push.
- Do not expose secrets.
- Do not mutate product code unless the prompt explicitly authorizes Claude Code execution for that task.

## Clean repo discipline

- Do not create files at repo root except approved entry/config files.
- Put durable screenshots under `docs/qa/screenshots/<topic>/`.
- Put competitive/product research under `docs/product/research/`.
- Put audits under `docs/audits/`.
- Keep generated caches/build outputs ignored.
- Do not delete tracked root artifacts blindly; move/archive with `git mv` unless a human explicitly approves deletion.

## Dispatch discipline

Use `/goal` for stop conditions:

```text
/goal Do not stop until the verification condition passes or a concrete blocker is proven.
```

Use `/loop` only for explicit recurring maintenance or watch tasks. A loop must state the interval, stop condition, and exactly what may be changed.

Use Context7 for library/API-sensitive work. Include the library id, docs topic, and version/signature used.

## Verification

For docs/rules only:

```bash
git diff --check
```

For product code:

```bash
bun run typecheck && bun run lint
```

For ship-impacting work:

```bash
bun run typecheck && bun run lint && bun run test:run && bun run build
```

UI work must also be checked at 1280px and 375px with clean console.
