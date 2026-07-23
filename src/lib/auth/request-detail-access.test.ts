import { describe, expect, it } from "vitest";

import { canViewRequestDetail } from "./request-detail-access";

describe("canViewRequestDetail", () => {
  it("allows public viewers for assembly requests", () => {
    expect(canViewRequestDetail({ mode: "assembly" }, "public")).toBe(true);
  });

  it("denies public viewers for private requests", () => {
    expect(canViewRequestDetail({ mode: "private" }, "public")).toBe(false);
  });

  it("allows the owner and guide for non-assembly requests", () => {
    expect(canViewRequestDetail({ mode: "private" }, "owner")).toBe(true);
    expect(canViewRequestDetail({ mode: "private" }, "guide")).toBe(true);
  });

  it("denies admins for non-assembly requests they do not own", () => {
    expect(canViewRequestDetail({ mode: "private" }, "admin")).toBe(false);
  });
});
