# Remove vite-tsconfig-paths Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Silence the `vite-tsconfig-paths` deprecation warning by replacing the plugin with Vite's native `resolve.tsconfigPaths: true` option.

**Architecture:** Single config file change — remove plugin import + usage, add native resolver option. No runtime behaviour changes; all `@/` path aliases continue to resolve identically.

**Tech Stack:** Vite 6, Vitest 4, `vitest.config.mts`.

---

## File Structure

| File | Change |
|------|--------|
| `vitest.config.mts` | Remove `tsconfigPaths` import + plugin call; add `resolve: { tsconfigPaths: true }` |

---

### Task 1: Migrate vitest config to native path resolution

**Files:**
- Modify: `vitest.config.mts`

- [ ] **Step 1: Replace the config file content**

Replace entire `vitest.config.mts` with:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
```

- [ ] **Step 2: Run a single test file to confirm warning is gone and paths resolve**

```bash
cd provodnik.app && npx vitest run src/lib/supabase/traveler-requests.test.ts 2>&1 | head -20
```

Expected output: NO line containing `vite-tsconfig-paths`. Tests pass (3 passing).

- [ ] **Step 3: Commit**

```bash
git add vitest.config.mts
git commit -m "chore: replace vite-tsconfig-paths plugin with native resolve.tsconfigPaths"
```
