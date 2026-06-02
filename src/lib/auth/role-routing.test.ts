import { describe, expect, it } from "vitest";

import {
  getRequiredRoleForPathname,
  resolveCanonicalRole,
  roleHasAccess,
} from "./role-routing";

describe("resolveCanonicalRole", () => {
  it("prefers profiles.role over a stale JWT app_metadata role", () => {
    expect(
      resolveCanonicalRole({
        profileRole: "guide",
        appMetadataRole: "traveler",
      }),
    ).toBe("guide");
  });

  it("falls back to app_metadata when profile role is missing", () => {
    expect(
      resolveCanonicalRole({
        profileRole: null,
        appMetadataRole: "guide",
      }),
    ).toBe("guide");
  });

  it("falls back to user_metadata when profile and app_metadata are missing", () => {
    expect(
      resolveCanonicalRole({
        profileRole: null,
        appMetadataRole: null,
        userMetadataRole: "admin",
      }),
    ).toBe("admin");
  });

  it("grants admin when profiles.role is admin even if JWT still says guide", () => {
    expect(
      resolveCanonicalRole({
        profileRole: "admin",
        appMetadataRole: "guide",
        userMetadataRole: "guide",
      }),
    ).toBe("admin");
  });
});

describe("roleHasAccess", () => {
  it("allows guides into the guide workspace", () => {
    expect(roleHasAccess("guide", "guide")).toBe(true);
  });

  it("denies travelers access to guide-only routes", () => {
    expect(roleHasAccess("traveler", "guide")).toBe(false);
  });

  it("denies travelers direct access to the admin workspace", () => {
    expect(roleHasAccess("traveler", "admin")).toBe(false);
  });
});

describe("getRequiredRoleForPathname", () => {
  it("requires guide role for the guide profile editor", () => {
    expect(getRequiredRoleForPathname("/guide/profile")).toBe("guide");
    expect(getRequiredRoleForPathname("/profile/guide/about")).toBe("guide");
  });
});

describe("guide profile editor access", () => {
  it("allows guides when profiles.role overrides a stale JWT traveler claim", () => {
    const role = resolveCanonicalRole({
      profileRole: "guide",
      appMetadataRole: "traveler",
    });
    const requiredRole = getRequiredRoleForPathname("/guide/profile");

    expect(role).toBe("guide");
    expect(requiredRole).toBe("guide");
    expect(roleHasAccess(role!, requiredRole!)).toBe(true);
  });
});
