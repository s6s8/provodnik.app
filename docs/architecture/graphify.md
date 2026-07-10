# Graphify code graph

Graphify is wired as a local refactor/navigation aid for Provodnik. It is not an app runtime dependency and should not be imported by product code.

## Why we use it

Use the graph before broad refactors or multi-surface bug work to answer:

- what files and symbols sit between two flows;
- what callers are affected by a shared action/type/component change;
- where guide/traveler/admin flows cross Supabase actions;
- which files a new agent should inspect first before editing.

The code-only graph uses AST extraction and does not require LLM/API credentials.

## Commands

Build or rebuild the current graph:

```bash
bun run graph:build
```

Check where the graph is and how large it is:

```bash
bun run graph:status
```

Ask a focused question:

```bash
bun run graph:query -- "where are guide offers converted into bookings?"
```

Find a shortest path between symbols:

```bash
bun run graph:path -- "acceptOfferAction()" "createBooking()"
```

Check blast radius:

```bash
bun run graph:affected -- "submitOfferAction" --depth 2
```

Explain a symbol and its neighbors:

```bash
bun run graph:explain -- "BidFormPanel()"
```

Print the generated report:

```bash
bun run graph:report
```

## Output location

By default the graph is written outside the repo:

```text
/tmp/provodnik-graphify/graphify-out/graph.json
/tmp/provodnik-graphify/graphify-out/GRAPH_REPORT.md
```

Override for a local machine if needed:

```bash
PROVODNIK_GRAPHIFY_DIR=/tmp/my-provodnik-graph bun run graph:build
```

Do not commit generated graph outputs. If someone runs Graphify directly in the repo, `graphify-out/` is ignored.

## Refactor workflow

1. Rebuild the graph after pulling or after a large commit.
2. Query Graphify for the intended flow or symbol.
3. Open the referenced files and verify the exact code before editing.
4. Make the smallest product-code change.
5. Run the normal gates: `bun run typecheck`, `bun run lint`, and focused tests when applicable.

## Caveats

- Repeated names like `page.tsx` or lazy re-export components can produce ambiguous paths; use exact function names with `()` when possible.
- Graphify is code navigation, not product verification. Browser/API/tests still prove behavior.
- `bun run graph:build` uses `uvx`, so the machine needs `uv` available.
