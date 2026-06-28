# Provodnik design-sync — repo notes

Provodnik is a **Next.js app, not a component library**. The package shape works only with the custom harness below.

## The working build recipe (re-apply on a fresh clone)
1. **Synth-entry mode** (no `dist`/`exports`): converter auto-barrels `export *` from `src/components/**`. Consequence: **`.d.ts` props are generic** (`[key: string]: unknown`) — improve later with `cfg.dtsPropsFor` or by adding a real component build.
2. **Mirror PKG_DIR (NOT an in-repo junction — that loops infinitely).** Build a mirror dir with package.json + junctions to `src` and `.design-sync`, but **NO node_modules**:
   ```sh
   mkdir -p /d/dev2/ds-mirror && cp package.json /d/dev2/ds-mirror/
   cmd //c "mklink /J D:\\dev2\\ds-mirror\\src D:\\dev2\\projects\\provodnik\\src"
   cmd //c "mklink /J D:\\dev2\\ds-mirror\\.design-sync D:\\dev2\\projects\\provodnik\\.design-sync"
   cmd //c "mklink /J D:\\dev2\\projects\\provodnik\\node_modules\\provodnik-app D:\\dev2\\ds-mirror"
   ```
   Run with **`--node-modules ./node_modules`** (the REAL repo node_modules — so deps resolve, the workspace bound stays the repo, and `extraEntries` aren't "outside workspace"). The mirror has no node_modules, so `exportedNames` walking PKG_DIR can't recurse into a self-junction → no loop/OOM. (An in-repo `node_modules/provodnik-app → repo` junction loops forever — `exportedNames` hangs/OOMs at ~13min/10GB.)
3. **`cssEntry` MUST be a REAL file physically inside the mirror** (`/d/dev2/ds-mirror/ds-styles.css`), `cfg.cssEntry: "ds-styles.css"`. A junctioned path's realpath escapes PKG_DIR → `! cssEntry resolves outside the package — skipped` → components render **UNSTYLED** (no preflight, browser-default). Regenerate + copy it each build:
   ```sh
   npx @tailwindcss/cli@4 -i ./src/app/globals.css -o ./.design-sync/compiled.css
   { echo '@import url("https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700;800&display=swap");'; cat .design-sync/compiled.css; printf '\n:root{--font-onest:"Onest",system-ui,sans-serif;}\n'; } > .design-sync/ds-styles.css
   cp .design-sync/ds-styles.css /d/dev2/ds-mirror/ds-styles.css
   ```
   `cssEntry` must be ONE self-contained file — the converter does NOT follow `@import "./compiled.css"` in it.
4. **`next/*` + `server-only` shims** via `tsconfig.sync.json` paths (`cfg.tsconfig`), NOT a bundle.mjs fork. Shims in `.design-sync/shims/`. `tsconfig.sync.json` MUST have `include`/`exclude` bounded to `src/components/**` + shims (else ts-morph type-checks the whole repo and OOMs).
5. **`DsProvider`** (`.design-sync/shims/ds-provider.tsx`) via `cfg.extraEntries: ["./.design-sync/shims/ds-provider.tsx"]` + `cfg.provider: {component:"DsProvider"}`. It defines `globalThis.process = {env:{}}` (+ a react-query client) so the universal `ReferenceError: process is not defined` (Next internals read `process.env.__NEXT_*`) goes away. Without it: **0/201 render**.

Build: `NODE_OPTIONS=--max-old-space-size=12288 node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --out ./ds-bundle` (add `--skip-dts` for fast fix-loop iterations; the FINAL build must omit it). Validate: `node .ds-sync/package-validate.mjs ./ds-bundle`.

## Result (first sync)
201 components bundled + styled (Onest + tokens), 192/201 render clean (rest are floor cards / radix sub-parts). 17 core primitives have authored previews (`.design-sync/previews/`), graded good.

## Re-sync risks / watch-list
- The **mirror + scratch junctions are NOT committed** — recreate per clone (step 2).
- `ds-styles.css` / `compiled.css` are **regenerated** — re-run step 3 whenever `globals.css` or component classes change, and re-copy into the mirror, or the kit silently goes unstyled.
- `.d.ts` props are generic (synth mode) — the design agent leans on `.prompt.md` + authored previews. Adding a real component-library build would upgrade prop fidelity.
- Onest loads via a remote Google Fonts `@import` (`[FONT_REMOTE]`) — not shipped; fine for previews.
- 173 components are floor cards — author more previews incrementally on any re-sync (authored files + grades carry forward).
- Some app-coupled components (cards needing real data/images) render minimal floor cards; that's expected, not a failure.
