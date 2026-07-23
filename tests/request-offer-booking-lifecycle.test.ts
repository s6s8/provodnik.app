import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const LIFECYCLE_TEST = "supabase/tests/request_offer_booking_lifecycle_test.sql";

function countPgtapAssertions(source: string): number {
  const patterns = [
    /\bselect\s+is\s*\(/gi,
    /\bselect\s+isnt\s*\(/gi,
    /\bselect\s+lives_ok\s*\(/gi,
    /\bselect\s+throws_ok\s*\(/gi,
    /\bselect\s+is_empty\s*\(/gi,
    /\bselect\s+isnt_empty\s*\(/gi,
  ];
  return patterns.reduce((total, pattern) => total + [...source.matchAll(pattern)].length, 0);
}

describe("request → offer → booking lifecycle regression", () => {
  it("keeps pgTAP plan count aligned with assertions", () => {
    const source = readFileSync(LIFECYCLE_TEST, "utf8");
    const planMatch = source.match(/\bselect\s+plan\s*\(\s*(\d+)\s*\)/i);
    expect(planMatch, `${LIFECYCLE_TEST} must declare select plan(n)`).not.toBeNull();

    const planned = Number(planMatch![1]);
    const assertions = countPgtapAssertions(source);
    expect(assertions).toBe(planned);
  });

  it("documents the isolated lifecycle runner", async () => {
    const gatingDoc = await import("node:fs/promises").then((fs) =>
      fs.readFile("docs/qa/e2e-gating.md", "utf8"),
    );

    expect(gatingDoc).toContain("bun run test:lifecycle");
    expect(gatingDoc).toContain("request_offer_booking_lifecycle_test.sql");
  });
});
