import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Honour the TypeScript convention: identifiers prefixed with `_` are
  // intentionally unused (mirrors `noUnusedLocals` behaviour). See
  // typescript-eslint docs on no-unused-vars.
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Layering boundary: the lib/ and data/ layers are infrastructure and must never
  // depend on feature modules (unidirectional dependency). See refactor task 4.1.
  {
    files: ["src/lib/**/*.{ts,tsx}", "src/data/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/features"],
              message: "lib/data must not import from features — extract shared types/constants into lib (layering).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local orchestration artefacts — not application code
    ".claude/**",
    // Phase 1 archived bek-era artefacts (gitignored, kept on local disk only)
    "_archive/**",
  ]),
]);

export default eslintConfig;
