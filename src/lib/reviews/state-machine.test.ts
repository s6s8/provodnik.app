import { describe, it, expect } from "vitest";
import {
  canTransitionReview,
  canTransitionReply,
  assertReviewTransition,
  assertReplyTransition,
} from "./state-machine";

describe("Review state machine", () => {
  it("allows draft → submitted", () => expect(canTransitionReview("draft", "submitted")).toBe(true));
  it("allows submitted → published", () => expect(canTransitionReview("submitted", "published")).toBe(true));
  it("allows submitted → hidden", () => expect(canTransitionReview("submitted", "hidden")).toBe(true));
  it("allows published → hidden", () => expect(canTransitionReview("published", "hidden")).toBe(true));
  it("blocks draft → published", () => expect(canTransitionReview("draft", "published")).toBe(false));
  it("blocks hidden → any", () => {
    expect(canTransitionReview("hidden", "draft")).toBe(false);
    expect(canTransitionReview("hidden", "published")).toBe(false);
  });
  it("assertReviewTransition throws on illegal", () => {
    expect(() => assertReviewTransition("draft", "published")).toThrow(/Illegal review transition/);
  });
});

describe("ReviewReply state machine", () => {
  it("allows draft → pending_review", () => expect(canTransitionReply("draft", "pending_review")).toBe(true));
  it("allows pending_review → published", () => expect(canTransitionReply("pending_review", "published")).toBe(true));
  it("allows pending_review → draft (rejection)", () => expect(canTransitionReply("pending_review", "draft")).toBe(true));
  it("blocks draft → published", () => expect(canTransitionReply("draft", "published")).toBe(false));
  it("blocks published → any", () => {
    expect(canTransitionReply("published", "draft")).toBe(false);
    expect(canTransitionReply("published", "pending_review")).toBe(false);
  });
  it("assertReplyTransition throws on illegal", () => {
    expect(() => assertReplyTransition("published", "draft")).toThrow(/Illegal reply transition/);
  });
});
