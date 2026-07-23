import { describe, expect, it } from "vitest";

import {
  getRequiredRoleForPathname,
  requiresAuthenticatedSession,
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

  it("ignores user_metadata when profile and app_metadata are missing", () => {
    expect(
      resolveCanonicalRole({
        profileRole: null,
        appMetadataRole: null,
        userMetadataRole: "admin",
      }),
    ).toBeNull();
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
    expect(getRequiredRoleForPathname("/guide/profile/about")).toBe("guide");
  });

  it("does not require authentication for explicit public guide routes", () => {
    expect(getRequiredRoleForPathname("/guides")).toBeNull();
    expect(getRequiredRoleForPathname("/guides/amina-steppe")).toBeNull();
    expect(
      getRequiredRoleForPathname("/guide/12345678-1234-4123-8123-123456789abc"),
    ).toBeNull();
  });

  it("keeps the guide workspace behind the guide role", () => {
    expect(getRequiredRoleForPathname("/guide/inbox")).toBe("guide");
    expect(getRequiredRoleForPathname("/guide/not-a-uuid")).toBe("guide");
  });
});

describe("requiresAuthenticatedSession — shared personal routes (#account-gating)", () => {
  it("gates /account on authentication without pinning it to a single role", () => {
    // /account is shared by every role, so it must NOT require a specific role
    // (that would lock guides/admins out) but MUST require a session at the edge.
    expect(getRequiredRoleForPathname("/account")).toBeNull();
    expect(requiresAuthenticatedSession("/account")).toBe(true);
    expect(requiresAuthenticatedSession("/account/notifications")).toBe(true);
  });

  it("does not force authentication on public routes", () => {
    expect(requiresAuthenticatedSession("/")).toBe(false);
    expect(requiresAuthenticatedSession("/requests")).toBe(false);
    expect(requiresAuthenticatedSession(null)).toBe(false);
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
