# Homepage3 — AI natural-language request bar

**Date:** 2026-06-02
**Status:** Approved design — ready for implementation plan
**Route:** `/v3` (new; current `/` homepage untouched, promotable to `/` behind a flag later)
**Feature dir:** `src/features/homepage3/`

## 1. Problem & goal

The current homepage (`/`, `HomePageShell2`) leads with a multi-field structured form
(`HomepageRequestForm`) for creating a traveler request. It is correct but heavy: the user
faces destination, date, time, group size, budget, themes, languages, notes up front.

**Goal:** a `/v3` homepage whose hero is a **single natural-language bar in the middle**.
The traveler types a free-form sentence (e.g. *«хочу гида в Москве на завтра, нас двое,
бюджет 5000, история и еда»*), and an LLM (via OpenRouter) extracts the structured request
fields. When a required field is missing, the assistant asks one short follow-up
(conversational fill). When all required fields are present, an explicit **«Создать запрос»**
button creates the request through the existing pipeline.

Mobile-first. Reuses the existing site nav bar. Reuses the existing request-creation server
action, validation schema, auth gate, and brand tokens — no reinvention of creation/auth.

## 2. Chosen UX (decided during brainstorming)

- **Flow:** conversational fill (parse what's stated → ask for what's missing → create). *(Not:
  silent pre-fill of the full form; not direct one-shot create.)*
- **Conversation shape:** **bar + live slot-chips.** One bar stays the hero. Below it, five chips
  represent the required fields and flip from grey/yellow ("missing") to green ("got it") as the
  LLM extracts them. The assistant asks only for the still-missing ones. The chips double as the
  visible review step. *(Not: a full chat thread; not a morphing single line with no history.)*
- **Create trigger:** explicit **«Создать запрос»** button, shown only once all required chips are
  green. One final human confirmation before a request is created.
- **Model:** chosen by a **bake-off** (§7), model-agnostic behind `OPENROUTER_MODEL`.

### The five required chips (from `travelerRequestSchema`)

| Chip | Field(s) | Required rule |
|---|---|---|
| 📍 Город | `destination` | 2–80 chars |
| 📅 Дата | `startDate` | valid date ≥ today (Moscow) |
| 👥 Сколько | `groupSize` (private) / `groupSizeCurrent` (assembly) | int 1–20 |
| ₽ Бюджет | `budgetPerPersonRub` | int 1 000–2 000 000 |
| 🏷 Темы | `interests[]` | ≥ 1 theme |

Optional fields (`requestedLanguages`, `startTime`, `endTime`, `notes`, the assembly toggle) are
extracted **if explicitly stated** but never block completion and are never asked for.

## 3. Architecture

### Route & shell
- `src/app/(home)/v3/page.tsx` — server component, mirrors `(home)/page.tsx`: renders
  `SiteHeaderServer` (existing nav) + `HomePage3Shell`, fetching `destinations` and passing
  `THEMES`.
- `src/features/homepage3/` — new isolated feature dir.

### Components (mobile-first, isolated)
- `components/hero-conversation.tsx` (**client**) — orchestrates the bar, the assistant's question
  line, the slot-chips, and the final confirm button. Full-height hero under the nav. Holds the
  running field state.
- `components/slot-chips.tsx` — **pure presentational**; renders the five chips green/yellow from a
  field-state object. No logic.
- `lib/parse-client.ts` — typed `fetch` wrapper to the parse API route.

### Server
- `src/app/api/requests/parse/route.ts` — POST handler wrapping OpenRouter. Reads
  `OPENROUTER_API_KEY` + `OPENROUTER_MODEL` from env (**never** exposed to the client). Strict
  system prompt (see §6). Request: `{ accumulatedFields, userText, todayMoscow }`. Response:
  `{ fields, missingRequired, assistantMessage, complete }`.
- `lib/openrouter.ts` — thin server-only client (base URL, auth header, JSON-mode call).
- `lib/extraction-schema.ts` — zod schema for the **LLM's JSON output**, plus the **merge** and
  **missing-required** logic as pure, unit-testable functions, plus **relative-date resolution**
  against a passed Moscow date.

### Reuse (no reinvention)
- `travelerRequestSchema` — server-side source-of-truth validation before any create.
- **`createRequestAction`** (`src/app/(protected)/traveler/requests/new/actions.ts`) — the existing
  server action does creation + auth check + guide notification. Homepage3 assembles `FormData` the
  same way `HomepageRequestForm` does and calls it. Creation logic is **not** duplicated.
- `HomepageAuthGate` — shown on confirm when the user is not authenticated, then continues to create
  (same pattern as today's form).
- `THEMES`, `LANGUAGES`, `todayMoscowISODate`, UI primitives (`Input`, `Button`), brand tokens
  (`font-display`, `max-page`, clamp typography).

## 4. Data flow

1. Hero loads: centered bar, five grey chips, nav on top.
2. User free-types → send → client POSTs `{ accumulatedFields, userText, todayMoscow }` to the parse
   route.
3. LLM extracts **only explicitly-stated** values → server validates the JSON shape, merges into
   accumulated fields, recomputes `missingRequired`, and produces `assistantMessage` (the next
   question, or a done message) + `complete`.
4. Client updates chips (green/yellow) and shows `assistantMessage` above the bar; the bar stays for
   the next answer.
5. When `complete` → **«Создать запрос»** appears. Tap → if not authenticated, `HomepageAuthGate` →
   on success, assemble `FormData` and call `createRequestAction` → success state ("запрос создан,
   гиды уведомлены").

State lives on the client between turns and is echoed back to the server each turn (stateless server
route — no session storage).

## 5. Anti-fabrication (CLAUDE.md §10 — the mission)

This is the primary correctness constraint and the bake-off's main scoring axis.

- The system prompt **forbids inventing field values.** If budget / date / group size / destination /
  theme is not explicitly stated by the user, the field stays `null` and the assistant asks for it.
  The model must never guess a budget or a date the user didn't give.
- **Relative-date resolution is interpretation, not fabrication:** "завтра" → tomorrow's Moscow date,
  "в субботу" → next Saturday, given the passed `todayMoscow`. Genuinely ambiguous phrasing ("на
  выходных", "летом") → the assistant asks rather than picks silently.
- The **chips** make the extraction transparent so the user catches a wrong read before creating.
- The **confirm button** is the final human gate.
- The **server re-validates** the assembled request with `travelerRequestSchema` before create — the
  client field state is never trusted on its own.

## 6. System prompt (sketch — finalized during implementation)

Constraints the prompt must encode:
- Output strict JSON matching the extraction schema; no prose outside JSON.
- Extract only values the user explicitly stated; use `null` for anything not stated. Do **not**
  infer or default budget, date, group size, destination, or themes.
- Map free-text themes onto the fixed `THEMES` slug set; if a stated interest matches no slug, ignore
  it (don't invent a slug).
- Resolve relative dates against the provided Moscow date; ask when ambiguous.
- Produce a short, friendly Russian `assistantMessage` asking for the single most useful missing
  required field (or confirming completeness).

## 7. Model bake-off (part of this spec)

A small offline eval harness picks the model before launch.

- **Harness:** a Node script (lives under `scripts/` in the provodnik repo, or the codex-ops ops repo
  — TBD in the plan) that feeds a fixed set of ~15–25 **synthetic** Russian test utterances through
  the OpenRouter chat-completions API for each candidate model and records the parsed JSON.
- **Candidates:** Gemini Flash, DeepSeek (Flash/V3), and optionally one more — all via OpenRouter,
  `--model auto`-style cheap tier first.
- **Sample set covers:** fully-specified inputs; partial inputs (missing 1–3 required); ambiguous
  inputs ("на выходных", "недорого"); relative dates ("завтра", "в эту субботу"); fabrication traps
  (input that mentions a city but no budget — model must leave budget `null`, not invent one);
  themes phrased in free text.
- **Scoring (primary → secondary):**
  1. **No fabrication** — zero invented values for unstated fields (hard gate; a model that invents a
     budget/date fails regardless of other scores).
  2. **Extraction accuracy** — stated fields parsed correctly.
  3. **Relative-date correctness.**
  4. **Next-question quality** — asks for a genuinely missing required field, in natural Russian.
- **Output:** a short comparison table; the orchestrator picks the winner and wires its OpenRouter id
  into `OPENROUTER_MODEL`. Design stays model-agnostic so the choice is a one-line env change.

## 8. Error handling

- LLM unreachable / non-JSON / schema-invalid output → friendly fallback message + a link to the
  classic structured form at `/`. Never a hard crash.
- Basic rate-limiting on the parse route (per-IP or per-session) to bound LLM cost.
- Server re-validation with `travelerRequestSchema` before create (see §5).
- Auth failure on create → existing `createRequestAction` error messaging.

## 9. Testing (TDD)

- **Unit (pure fns in `lib/extraction-schema.ts`):** merge accumulated + new fields;
  `missingRequired` computation across private/assembly modes; relative-date resolution
  (RED→GREEN→REFACTOR).
- **API route:** with a **mocked** OpenRouter, assert request/response shape, JSON validation, and the
  fallback path on bad model output. (Model quality itself is covered by the §7 bake-off, not unit
  tests.)
- **Component:** a `hero-conversation` test with a mocked parse endpoint covering the happy path
  (type → chips fill → confirm appears), mirroring the existing
  `homepage-hero-form.test.tsx`.

## 10. Non-goals (YAGNI)

- No full chat thread / message history persistence.
- No voice input.
- No streaming token-by-token rendering (single JSON response per turn is enough).
- No edits to the existing `/` homepage or `HomepageRequestForm` beyond optionally linking to `/v3`.
- No promotion to `/` in this iteration (flag swap is a later, separate change).

## 11. Implementation routing note

Per the orchestrator operating card §7, product code under `provodnik.app` is implemented by the
project's dispatched coder (not Claude-direct). The orchestrator composes per-task prompts from the
plan, embeds the relevant context, and verifies. The bake-off harness + spec/plan authoring are
orchestrator work.
