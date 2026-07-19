import { describe, expect, it } from "vitest";

import { canSeeRequestNotes } from "./request-notes-visibility";

describe("canSeeRequestNotes", () => {
  it("lets the owner and admins read the private notes", () => {
    expect(canSeeRequestNotes({ viewerRole: "owner" })).toBe(true);
    expect(canSeeRequestNotes({ viewerRole: "admin" })).toBe(true);
  });

  it("lets only an APPROVED guide read the notes", () => {
    expect(canSeeRequestNotes({ viewerRole: "guide", isApprovedGuide: true })).toBe(true);
    expect(canSeeRequestNotes({ viewerRole: "guide", isApprovedGuide: false })).toBe(false);
    expect(canSeeRequestNotes({ viewerRole: "guide" })).toBe(false);
  });

  it("never exposes notes to the public (anon, prospective joiner, member)", () => {
    expect(canSeeRequestNotes({ viewerRole: "public" })).toBe(false);
  });
});
