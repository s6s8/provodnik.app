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

// Final live-QA repair (2026-07-19): an independent prod replay reported that an
// approved+available guide with EMPTY regions/languages is silently absent from
// public discovery. Source trace + a read-only prod query proved the real cause
// was the guide's `qa-` seed slug, not the empty arrays: the only approved guide
// with empty regions/languages was also the only one with a `qa-` slug, so the two
// variables were confounded. The public gate (verification_status='approved' +
// is_available=true + role='guide' + active account + non-`qa-` slug) never
// requires non-empty regions/languages. These tests lock that invariant at the JS
// boundary where an empty-array exclusion could realistically be re-introduced.
describe("empty optional profile arrays keep an approved guide discoverable (final live-QA 2026-07-19)", () => {
  it("applyGuideFilters keeps a non-QA guide whose regions are empty", () => {
    const guides = [{ slug: "real-guide", destinations: [] } as unknown as GuideRecord];
    expect(applyGuideFilters(guides).map((g) => g.slug)).toEqual(["real-guide"]);
  });

  it("mapGuideRow yields a valid discoverable record when regions AND languages are empty", () => {
    const record = mapGuideRow(
      { user_id: "u1", slug: "real-guide", display_name: "Аян", regions: [], languages: [] },
      { full_name: "Аян ФИО" },
    );
    // The record is fully formed — nothing about empty arrays drops or breaks it.
    expect(record.slug).toBe("real-guide");
    expect(record.fullName).toBe("Аян");
    expect(record.destinations).toEqual([]);
    expect(record.languages).toEqual([]);
    // A guide with no declared region still gets a sane home-base label.
    expect(record.homeBase).toBe("Россия");
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
