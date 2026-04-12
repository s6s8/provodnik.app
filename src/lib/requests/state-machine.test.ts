import { describe, it, expect } from "vitest";
import { canTransition, assertTransition, isTripsterStatus, type TripsterOfferStatus } from "./state-machine";

describe("TripsterOfferStatus state machine", () => {
  it("allows bid_sent → confirmed", () => {
    expect(canTransition("bid_sent", "confirmed")).toBe(true);
  });

  it("allows bid_sent → declined", () => {
    expect(canTransition("bid_sent", "declined")).toBe(true);
  });

  it("allows confirmed → active", () => {
    expect(canTransition("confirmed", "active")).toBe(true);
  });

  it("allows confirmed → declined", () => {
    expect(canTransition("confirmed", "declined")).toBe(true);
  });

  it("allows active → completed", () => {
    expect(canTransition("active", "completed")).toBe(true);
  });

  it("blocks bid_sent → completed", () => {
    expect(canTransition("bid_sent", "completed")).toBe(false);
  });

  it("blocks bid_sent → active", () => {
    expect(canTransition("bid_sent", "active")).toBe(false);
  });

  it("blocks completed → any", () => {
    const targets: TripsterOfferStatus[] = ["bid_sent", "confirmed", "active", "declined"];
    for (const t of targets) {
      expect(canTransition("completed", t)).toBe(false);
    }
  });

  it("blocks declined → any", () => {
    const targets: TripsterOfferStatus[] = ["bid_sent", "confirmed", "active", "completed"];
    for (const t of targets) {
      expect(canTransition("declined", t)).toBe(false);
    }
  });

  it("assertTransition throws on illegal transition", () => {
    expect(() => assertTransition("bid_sent", "completed")).toThrow(/Illegal offer transition/);
  });

  it("assertTransition does not throw on legal transition", () => {
    expect(() => assertTransition("bid_sent", "confirmed")).not.toThrow();
  });

  it("isTripsterStatus identifies tripster values", () => {
    expect(isTripsterStatus("bid_sent")).toBe(true);
    expect(isTripsterStatus("pending")).toBe(false);
    expect(isTripsterStatus("accepted")).toBe(false);
  });
});
