import { describe, expect, it } from "vitest";

import { isPublicGuideRoute } from "./public-guide-routes";

describe("isPublicGuideRoute", () => {
  it("allows the public guides catalog", () => {
    expect(isPublicGuideRoute("/guides")).toBe(true);
    expect(isPublicGuideRoute("/guides/")).toBe(true);
  });

  it("allows a public guide profile slug", () => {
    expect(isPublicGuideRoute("/guides/amina-steppe")).toBe(true);
  });

  it("allows only the legacy uuid redirect under /guide", () => {
    expect(
      isPublicGuideRoute("/guide/12345678-1234-4123-8123-123456789abc"),
    ).toBe(true);
  });

  it("does not treat guide workspace paths as public", () => {
    expect(isPublicGuideRoute("/guide")).toBe(false);
    expect(isPublicGuideRoute("/guide/profile")).toBe(false);
    expect(isPublicGuideRoute("/guide/inbox")).toBe(false);
    expect(isPublicGuideRoute("/guide/not-a-uuid")).toBe(false);
  });
});
