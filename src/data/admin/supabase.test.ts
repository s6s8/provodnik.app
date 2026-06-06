import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("dead Supabase modules and exports", () => {
  it("keeps audited unused Supabase modules removed", () => {
    expect(existsSync(join(root, "src/data/admin/supabase.ts"))).toBe(false);
    expect(existsSync(join(root, "src/data/reviews/supabase-client.ts"))).toBe(false);
    expect(existsSync(join(root, "src/data/traveler-request/submit.ts"))).toBe(false);
    expect(existsSync(join(root, "src/features/traveler/actions/accept-offer.ts"))).toBe(false);
  });

  it("keeps unused review list exports removed from the canonical server helper", () => {
    const reviewsSource = source("src/lib/supabase/reviews.ts");

    expect(reviewsSource).not.toContain("export async function getReviewsForGuide");
    expect(reviewsSource).not.toContain("export async function getReviewsForListing");
  });

  it("keeps guide inbox dead branches out", () => {
    const inboxSource = source(
      "src/features/guide/components/requests/guide-requests-inbox-screen.tsx",
    );

    expect(inboxSource).not.toContain("Принятых предложений пока нет.");
  });
});
