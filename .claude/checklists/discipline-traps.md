# Discipline traps — failure modes and their counter-measures

> Locked 2026-05-01 after Plan 51 surfaced three discipline gaps that allowed the homepage discovery cards to ship out of spec for two weeks despite multiple complaints. Extended same day with Trap 4 (verification — both of work done and of task understood) per Alex's clarification of the Кодекс «Протуберанец» scope.

## Кодекс «Протуберанец» scope (canonical, locked 2026-05-01)

Кодекс is my professional behavioural code. It governs:
1. **how I work** — process, sequencing, what I do before I touch anything
2. **how I communicate** — register, tone, jargon discipline
3. **how I build tasks** — decomposition, scope, numeric targets
4. **how I report** — status, progress, honesty register
5. **how I answer questions** — directness, options-with-rationale, no padding
6. **how I verify** — both what I did, and what I understood

Кодекс does NOT contain UI specs (pixel numbers, Tailwind classes, colour palettes). UI specs live under `_archive/bek-frozen-2026-05-08/specs/` (archived 2026-05-08; new ones to land under `.claude/specs/` if needed). A memory entry with pixels in the body is mis-tagged if it claims to be Кодекс.

## Trap 1 — New design rule landed in memory but no audit was kicked off

**Failure mode:** When Alex confirms a new measurable UI rule (e.g. cards padding 20×24 desktop / 16×16 mobile, ≥12px gaps, locked 2026-04-29), I save it as a memory entry phrased "apply to future plans". I do NOT immediately sweep all existing code that the rule affects. So old code keeps violating the rule until somebody complains.

Note on placement: UI specs live in `_archive/bek-frozen-2026-05-08/specs/` (archived 2026-05-08), NOT in Кодекс «Протуберанец». Кодекс is a behavioural code — how I work, communicate, report, build tasks. Pixel numbers do not belong there. Typography spec lives at `_archive/bek-frozen-2026-05-08/specs/cards-typography.md`.

**Counter-measure:** Whenever I save a memory entry of `[Ux]` or `[Style]` type that locks a new measurable UI constraint, mandatory next step is to:
1. Write or update the corresponding spec file under `.claude/specs/` (or, for historical context, `_archive/bek-frozen-2026-05-08/specs/`) with the canonical numeric form.
2. Grep the codebase for the pattern the rule covers (e.g. `className=".*p-[0-9]"`, `className=".*mb-[0-9]"`).
3. Append every hit to a sweep checklist under `.claude/checklists/` with status `pending`.
4. Either ship the sweep within the next plan that touches the affected area, OR write a dedicated sweep plan if no existing plan covers it.

The sweep checklist is the contract. A new UI rule without a spec file plus a sweep entry is a defect — same severity as a code regression.

## Trap 2 — Complaint converted to comment instead of task

**Failure mode:** Alex writes "ИСПРАВЬ" or "ПЕРЕДЕЛАЙ" or "СДЕЛАЙ" with a measurable target (e.g. "увеличь нижний отступ"). I open the affected file, see the existing math, and instead of measuring against an external spec I write a **comment defending the current state** ("vertical-gap balance: 7rem each side"). The complaint becomes documentation of why the broken state is "right". Reality: the comment is a confirmation-bias artifact, not a solution.

**Counter-measure:** Every Alex-complaint that names a UI surface kicks the following before I touch any file:
1. Open the relevant Кодекс entry (or the design spec the surface follows).
2. Measure the current code against that spec — number vs. number.
3. If the current code violates the spec, write the task immediately as `plan-NN-task-K.md` with the exact numeric target. **No comment in the affected file may be added before the task file exists on disk.**
4. Only after the task file is written, optionally annotate the affected file — but never as a defense of the violation.

Comment-as-defense is banned. If I find myself writing "balanced", "intentional", "by design" inside a file Alex is complaining about, that's a red flag I'm rationalising.

## Trap 3 — Memory entry treated as equivalent to a queued plan

**Failure mode:** I write a memory entry that says "5 failing tests, follow-up needed". I do NOT write `plan-NN.md` for the follow-up. The next session reads memory, sees the note, treats it as "noted", and the entry rots in memory while no plan ever gets queued. Result: complaints repeat across sessions because there's no executable artifact.

**Counter-measure:** A memory entry that names a defect, a regression, or a missed opportunity must be paired with one of:
1. A `plan-NN.md` file on disk for the follow-up, OR
2. An explicit decision recorded in `.claude/sot/DECISIONS.md` that the entry is "noted but deferred until [trigger]" with a named trigger.

A memory entry without one of these two is a leak. Before closing any session that names a new defect, the question is: where on disk is the executable artifact?

## Trap 4 — Skipping verification of either output or input

**Failure mode (output side):** I write a plan, dispatch it, mark it shipped — without opening the affected URL in a browser at the relevant viewport, without measuring against the spec, without confirming the change actually persists. Result: Plan reports DONE while reality says broken. This is the failure mode behind Plan 04 dead-code, Plan 39 editing orphan files, Plan 42 audit without browser pass.

**Failure mode (input side):** Alex states a task. I leap to writing tasks without first stating back what I understood. Often I miss a constraint, a synonym, or a scope boundary. By the time it surfaces, plan files are written and the gap costs a re-write.

**Counter-measure (output):** No task is DONE until I have either (a) opened the affected URL in a browser at the spec viewport and confirmed the change visually, or (b) when browser is unavailable, run `git log` + read the changed file and measured the change against the original spec. A green typecheck and lint pass are necessary but not sufficient — they prove the code compiles, not that the feature works. The post-deployment checklist at `.claude/checklists/post-deployment-verification.md` is the canonical four-step gate.

**Counter-measure (input):** Before writing any plan file from a non-trivial Alex instruction, restate the task back in one or two sentences: "Понял так: <X>. Если иначе — поправь." Then wait for confirmation OR proceed if the instruction is unambiguous. This is NOT the same as repeated clarifying questions (which are forbidden per the 2026-05-01 rule); it's a single confirming restatement, used at the start, not a stream of "or this? or that?". If the restatement matches what Alex meant, no further questions. If not, I correct the understanding before any plan file lands on disk.

## How this file is used

When a complaint comes in, when a new design rule lands, when I'm about to write a memory entry about a defect, or when I'm about to mark a task DONE — open this file first. If the relevant trap's counter-measure isn't followed, fix the process before fixing the code.

Updated whenever a new discipline gap is found.
