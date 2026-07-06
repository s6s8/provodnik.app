import { describe, expect, it } from "vitest";

import { makeError } from "./queries-core";

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
