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
  // Data-access boundary (refactor Phase 1 / task 4.5): Supabase I/O belongs in
  // src/lib/supabase/<domain>.ts only. src/data is static-only; src/components is UI.
  // Forbid `.from(` / `.rpc(` query calls and supabase client factory imports in those
  // layers. warn-level + lint ratchet (.eslint-baseline.json) grandfathers the known
  // pre-refactor offenders and fails the ratchet on any NEW violation, so drift can only
  // shrink. Array.from / Object.from / Buffer.from are excluded (not data access).
  {
    files: ["src/data/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      // Folded into no-restricted-syntax (not no-restricted-imports) so it does not
      // collide with / weaken the error-level `features` import ban on src/data above.
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "CallExpression[callee.property.name='from'][callee.object.name!='Array'][callee.object.name!='Object'][callee.object.name!='Buffer']",
          message:
            "Supabase table/storage access (.from) is not allowed in src/data or src/components — move it to src/lib/supabase/<domain>.ts (data-access boundary).",
        },
        {
          selector: "CallExpression[callee.property.name='rpc']",
          message:
            "Supabase .rpc() is not allowed in src/data or src/components — move it to src/lib/supabase/<domain>.ts (data-access boundary).",
        },
        {
          selector:
            "ImportDeclaration[source.value=/^@supabase\\/(ssr|supabase-js)$/]",
          message:
            "Do not create a Supabase client in src/data or src/components — I/O lives in src/lib/supabase/<domain>.ts.",
        },
        {
          selector:
            "ImportDeclaration[source.value=/^@\\/lib\\/supabase\\/(server|client)$/]",
          message:
            "Do not import the Supabase client factory in src/data or src/components — I/O lives in src/lib/supabase/<domain>.ts.",
        },
      ],
    },
  },
  // Design-token gate — files migrated onto the unified token system must not
  // reintroduce arbitrary color/radius/shadow values or raw color literals.
  // Everything goes through globals.css @theme + the atom layer. This list grows
  // as more pages are migrated; flip to a global rule once the rollout is done.
  {
    files: [
      "src/features/homepage-classic/components/homepage-shell2-classic.tsx",
      "src/features/homepage-classic/components/homepage-hero-form-classic.tsx",
      "src/features/homepage-classic/components/homepage-request-form-classic.tsx",
      "src/components/shared/open-group-card.tsx",
      "src/components/shared/destination-tile.tsx",
      "src/components/shared/interest-tag.tsx",
      "src/components/ui/scrim.tsx",
      "src/components/ui/field-shell.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/-\\[#|(?:rgb|rgba|hsl)\\(|(?:rounded|shadow|text|bg|border|fill|stroke|ring)-\\[#/]",
          message:
            "Use a design token, not an arbitrary color/radius/shadow value. Add a role to globals.css @theme or use an atom.",
        },
        {
          selector:
            "TemplateElement[value.raw=/-\\[#|(?:rgb|rgba|hsl)\\(|(?:rounded|shadow|text|bg|border|fill|stroke|ring)-\\[#/]",
          message:
            "Use a design token, not an arbitrary color/radius/shadow value. Add a role to globals.css @theme or use an atom.",
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
