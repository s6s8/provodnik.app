# TYPE: BROWSER-AUDIT

You are executing one BROWSER-AUDIT row. The output is a findings file
under `_archive/bek-frozen-2026-05-08/sot/findings-*.md`. No code commit (unless fixes are bundled
in the row's body, which they are NOT in this ledger).

## Recipe

1. Read your row's `title` and `verify:` clause to find the output path
   (`_archive/bek-frozen-2026-05-08/sot/findings-<slug>.md`) and the route inventory.
2. If the route inventory is "discover via find":
   ```
   find provodnik.app/src/app -name page.tsx
   ```
   Filter per the row's scope description.
3. Login if needed: navigate to `/sign-in`, fill the credentials specified
   in the row (per `reference_provodnik_test_credentials.md` in memory).
4. For each route × each viewport:
   ```
   mcp__plugin_chrome-devtools-mcp__resize_page (width, height)
   mcp__plugin_chrome-devtools-mcp__navigate_page (url)
   mcp__plugin_chrome-devtools-mcp__take_snapshot
   mcp__plugin_chrome-devtools-mcp__take_screenshot
   mcp__plugin_chrome-devtools-mcp__list_console_messages
   ```
5. Inspect each snapshot for:
   - Visual breakage (overlapping elements, broken layout)
   - Fake data / fictional content (per vision: "honest product, no fiction")
   - Broken empty states
   - Console errors (filter from list_console_messages)
   - Accessibility / responsive issues
6. Write findings to the output path. Format per the row body's spec
   (typically: header with totals + severity breakdown, then per-finding
   blocks with route, viewport, screenshot path, severity, description).
7. Severity assignment:
   - P0 = breaks core flow (login, request submission, payment)
   - P1 = visible regression on a major route at default viewport
   - P2 = cosmetic, off-route, or only-on-edge-viewport
8. At the top of the findings file, write a "Closed" status block once
   you've covered all routes × viewports:
   ```
   Status: closed
   Audited: <ISO date>
   Routes: <count>
   Findings: <total> (P0: N, P1: N, P2: N)
   Top by priority: <ID list>
   ```
9. Update ledger row `[x]` with `commit: no-commit`, `evidence:` =
   "<findings-file> with N findings (P0: x, P1: y, P2: z)".
10. Exit 0.

## chrome-devtools-mcp availability fallback

If `mcp__plugin_chrome-devtools-mcp__*` tools are not available in this
session (e.g., T024 hasn't successfully unlocked them):
- Use the project's `webapp-testing` skill (Playwright-based) instead.
- If neither is available, use the Bash tool to script Chromium directly:
  - `npx playwright codegen <url>` to capture; or
  - Curl the route, parse HTML for obvious breakage signals.
- The user's vision is "do not stop". Find a way.

## Self-healing

If a route returns 500 or non-200:
- Log the failure as a P0 finding ("route 500 — server error: <message>").
- Continue with remaining routes. Do not abort the audit.

If login fails:
- Try the alternate credentials from memory.
- If both fail, log as P0 ("auth gate broken") and audit anonymous routes
  only. Mark the rest as `not-audited (auth-blocked)` in findings.

If a screenshot capture fails:
- Take a snapshot only (no screenshot). Note in findings.

## Ledger update — exact format

Same shape as CHECK with `commit: no-commit`.
