import { describe, expect, it } from "vitest";

import { hasAdminRole, isAdminAuthUser, readJwtRole } from "./admin-access";
import { resolveCanonicalRole } from "./role-routing";

describe("hasAdminRole", () => {
  it("returns true when profiles.role is admin", () => {
    expect(
      hasAdminRole({
        profileRole: "admin",
        appMetadataRole: "guide",
        userMetadataRole: "traveler",
      }),
    ).toBe(true);
  });

  it("returns true when JWT app_metadata.role is admin", () => {
    expect(
      hasAdminRole({
        profileRole: "guide",
        appMetadataRole: "admin",
      }),
    ).toBe(true);
  });

  it("ignores user_metadata.role for admin decisions", () => {
    expect(
      hasAdminRole({
        profileRole: "guide",
        appMetadataRole: "traveler",
        userMetadataRole: "admin",
      }),
    ).toBe(false);
  });
});

describe("isAdminAuthUser", () => {
  it("allows admin via profile when JWT is stale guide", () => {
    expect(isAdminAuthUser({ profileRole: "admin", jwtRole: "guide" })).toBe(true);
  });

  it("allows admin via JWT when profile row is missing", () => {
    expect(isAdminAuthUser({ profileRole: null, jwtRole: "admin" })).toBe(true);
  });

  it("denies non-admin traveler", () => {
    expect(isAdminAuthUser({ profileRole: "traveler", jwtRole: "traveler" })).toBe(false);
  });
});

describe("readJwtRole", () => {
  it("reads app_metadata.role and ignores user_metadata.role", () => {
    expect(
      readJwtRole({
        user_metadata: { role: "admin" },
        app_metadata: { role: "guide" },
      }),
    ).toBe("guide");
  });

  it("returns null when only user_metadata.role is present", () => {
    expect(
      readJwtRole({
        user_metadata: { role: "admin" },
        app_metadata: {},
      }),
    ).toBeNull();
  });
});

describe("resolveCanonicalRole admin elevation", () => {
  it("prefers profiles.role over stale JWT for traveler/guide", () => {
    expect(
      resolveCanonicalRole({
        profileRole: "guide",
        appMetadataRole: "traveler",
      }),
    ).toBe("guide");
  });

  it("grants admin when JWT carries admin but profile is still guide", () => {
    expect(
      resolveCanonicalRole({
        profileRole: "guide",
        appMetadataRole: "admin",
      }),
    ).toBe("admin");
  });
});
