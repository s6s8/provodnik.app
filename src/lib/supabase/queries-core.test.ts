import { describe, expect, it } from "vitest";

import {
  applyGuideFilters,
  isQaGuideSlug,
  makeError,
  type GuideRecord,
} from "./queries-core";

describe("makeError (#40)", () => {
  it("preserves the PostgREST error message and code", () => {
    // supabase-js rejects with a plain object, not an Error instance.
    const err = makeError({ message: "permission denied for table guide_offers", code: "42501" });

    expect(err.message).toBe("permission denied for table guide_offers");
    expect(err.name).toBe("42501");
  });

  it("passes Error instances through unchanged", () => {
    const original = new Error("boom");
    expect(makeError(original)).toBe(original);
  });

  it("falls back for value types without a message", () => {
    expect(makeError("nope").message).toBe("Unknown Supabase error");
    expect(makeError(null).message).toBe("Unknown Supabase error");
  });
});

describe("isQaGuideSlug (F-10)", () => {
  it("flags qa- seed slugs regardless of case", () => {
    expect(isQaGuideSlug("qa-guide-test-904cdd5c")).toBe(true);
    expect(isQaGuideSlug("QA-Guide-Test")).toBe(true);
  });

  it("leaves real guide slugs alone", () => {
    expect(isQaGuideSlug("жюль-верников-69f18040")).toBe(false);
    expect(isQaGuideSlug("qatar-tours")).toBe(false); // not the "qa-" prefix
    expect(isQaGuideSlug(null)).toBe(false);
    expect(isQaGuideSlug(undefined)).toBe(false);
  });
});

describe("applyGuideFilters QA hiding (F-10)", () => {
  const guide = (slug: string, destinations: string[] = []) =>
    ({ slug, destinations } as unknown as GuideRecord);

  it("drops QA seed guides from every catalog result", () => {
    const guides = [guide("qa-guide-test-904cdd5c"), guide("real-guide")];
    expect(applyGuideFilters(guides).map((g) => g.slug)).toEqual(["real-guide"]);
  });

  it("hides QA guides even when a destination filter is applied", () => {
    const guides = [
      guide("qa-guide-test-904cdd5c", ["Казань"]),
      guide("real-guide", ["Казань"]),
    ];
    const result = applyGuideFilters(guides, { destination: "Казань" });
    expect(result.map((g) => g.slug)).toEqual(["real-guide"]);
  });
});
