# OVERRIDES — tactics only (never scope, never rails)

- **Parallelism over sequence.** The plan implies task-by-task execution. Ten cards were
  genuinely independent, so five subagents ran concurrently in this one worktree against disjoint
  file lists, with the integrator (me) doing all git writes. Cards, order and proofs were
  unchanged — only the wall-clock shape.

- **Hunk-level staging to keep commits atomic.** Two cards legitimately shared a file
  (`users-console.tsx`: B1's filters + A5's badge; `schema.ts`: A4's schema + B1's filter fields;
  `request-detail-screen.tsx`: C5's hero + C6's declension). Rather than fold cards together,
  each file was split with `printf 'y\nn\n…' | git add -p`, verified with
  `git diff --cached <file>`. One concern per commit survived.

- **Query-count proof instead of a HAR (A3).** The plan asks for a browser HAR trace. A HAR is
  wall-clock on one machine and cannot be re-run as a gate. The causal fact is the query count
  (8 → 2), so the proof is a test whose mock client *throws* if the nav counts touch
  `bookings`/`disputes`. Stated plainly in the audit, including what was not measured.

- **Runbook rehearsal against a real Postgres (A2).** Not asked for. A runbook that has never
  executed is a hypothesis, and its central safety claim (the false-positive exclusion) was
  untested rhetoric until a fixture proved it.

- **Served the built app to verify the flag and the footer (C1, C8).** The plan scopes C8 to a
  production repro, which is an external gate. Building and serving locally is not the same
  proof, but it is a real one — and it is what caught F-05, a genuine bug that every unit test
  passed straight through.

Rails held: no push, no prod SQL, no deploy, no weakened tests, no fabricated proof.
