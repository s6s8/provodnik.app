import { describe, expect, it } from "vitest";

import { updateTravelerProfile } from "./actions";

describe("updateTravelerProfile", () => {
  it("rejects bio with a phone number", async () => {
    const fd = new FormData();
    fd.set("bio", "Звоните 89001234567");
    const result = await updateTravelerProfile(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/Контактные данные/);
    }
  });

  it("accepts a clean bio", async () => {
    const fd = new FormData();
    fd.set("bio", "Люблю горы и море");
    const result = await updateTravelerProfile(fd);
    expect(result.ok).toBe(true);
  });
});
