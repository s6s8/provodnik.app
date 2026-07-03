// Compatibility shim (refactor Phase 2). The Supabase I/O for these discovery/guide
// queries moved to the canonical home at src/lib/supabase/queries.ts. This re-export
// keeps the ~44 existing `@/data/supabase/queries` importers working unchanged while
// they migrate to the new path domain-by-domain. No I/O lives here anymore.
export * from "@/lib/supabase/queries";
