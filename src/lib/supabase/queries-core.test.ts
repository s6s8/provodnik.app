import { describe, expect, it } from "vitest";

import {
  applyGuideFilters,
  isQaGuideSlug,
  makeError,
  mapGuideRow,
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

// Item 13, the two-field name standard: guide_profiles.display_name is the PUBLIC name;
// profiles.full_name is the private, admin-only FIO. Getting this precedence backwards
// is not cosmetic — it published every guide's legal name on /guides/[slug], the request
// page, the booking screen and the traveler's chat header.
describe("mapGuideRow public name", () => {
  const gp = {
    user_id: "11111111-1111-4111-8111-111111111111",
    slug: "gilyana-elista",
    display_name: "Гиляна",
    regions: ["Калмыкия"],
    base_city: "Элиста",
  };

  it("prefers the public display name over the private full name", () => {
    const record = mapGuideRow(gp, { full_name: "Гиляна Манджиева" });

    expect(record.fullName).toBe("Гиляна");
    expect(record.initials).toBe("Г");
  });

  it("falls back to the full name for a legacy guide with no display name", () => {
    const record = mapGuideRow({ ...gp, display_name: null }, { full_name: "Баир Очиров" });

    expect(record.fullName).toBe("Баир Очиров");
  });

  it("falls back to the role label when neither name exists", () => {
    const record = mapGuideRow({ ...gp, display_name: null }, null);

    expect(record.fullName).toBe("Локальный гид");
  });
});
