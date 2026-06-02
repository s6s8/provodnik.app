import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CHECKLIST_ACCOUNT_EMAILS } from "@/lib/auth/checklist-account-emails";

const REPAIR_MIGRATION = join(
  process.cwd(),
  "supabase/migrations/20260602150000_repair_checklist_credentials_by_email.sql",
);

describe("repair_checklist_credentials_by_email migration", () => {
  const sql = readFileSync(REPAIR_MIGRATION, "utf8");

  it("updates auth.users by email, not only fixed seed UUIDs", () => {
    expect(sql).toMatch(/lower\(trim\(u\.email\)\)\s*=\s*lower\(acct\.email\)/);
    expect(sql).not.toMatch(/on conflict \(id\) do update set[\s\S]*encrypted_password/);
  });

  it.each(CHECKLIST_ACCOUNT_EMAILS)("covers %s", (email) => {
    expect(sql).toContain(email);
  });
});
