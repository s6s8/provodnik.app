import { describe, it, expect } from "vitest";
import { canTransitionListing, assertListingTransition, isModerationStatus } from "./state-machine";

describe("Listing moderation state machine", () => {
  it("allows draft → pending_review", () => expect(canTransitionListing("draft", "pending_review")).toBe(true));
  it("allows pending_review → active", () => expect(canTransitionListing("pending_review", "active")).toBe(true));
  it("allows pending_review → rejected", () => expect(canTransitionListing("pending_review", "rejected")).toBe(true));
  it("allows rejected → pending_review (re-submit after edit)", () => expect(canTransitionListing("rejected", "pending_review")).toBe(true));
  it("allows active → pending_review (edit flow)", () => expect(canTransitionListing("active", "pending_review")).toBe(true));
  it("allows active → archived", () => expect(canTransitionListing("active", "archived")).toBe(true));
  it("allows rejected → archived", () => expect(canTransitionListing("rejected", "archived")).toBe(true));
  it("blocks draft → active", () => expect(canTransitionListing("draft", "active")).toBe(false));
  it("blocks draft → rejected", () => expect(canTransitionListing("draft", "rejected")).toBe(false));
  it("blocks archived → any", () => {
    expect(canTransitionListing("archived", "active")).toBe(false);
    expect(canTransitionListing("archived", "pending_review")).toBe(false);
  });
  it("assertListingTransition throws on illegal", () => {
    expect(() => assertListingTransition("draft", "active")).toThrow(/Illegal listing transition/);
  });
  it("isModerationStatus identifies valid values", () => {
    expect(isModerationStatus("pending_review")).toBe(true);
    expect(isModerationStatus("published")).toBe(false);
  });
});
