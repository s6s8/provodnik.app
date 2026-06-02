import { describe, expect, it } from "vitest";

import { mergeProfileRoleIntoAccessTokenClaims } from "@/lib/auth/access-token-claims";

describe("mergeProfileRoleIntoAccessTokenClaims", () => {
  it("sets app_metadata.role when app_metadata is missing", () => {
    expect(
      mergeProfileRoleIntoAccessTokenClaims(
        { sub: "user-1", role: "authenticated" },
        "admin",
      ),
    ).toEqual({
      sub: "user-1",
      role: "authenticated",
      app_metadata: { role: "admin" },
    });
  });

  it("replaces json-null app_metadata (hook coalesce pitfall)", () => {
    expect(
      mergeProfileRoleIntoAccessTokenClaims(
        { sub: "user-1", role: "authenticated", app_metadata: null },
        "admin",
      ),
    ).toEqual({
      sub: "user-1",
      role: "authenticated",
      app_metadata: { role: "admin" },
    });
  });

  it("preserves existing app_metadata keys for traveler sign-in", () => {
    expect(
      mergeProfileRoleIntoAccessTokenClaims(
        {
          sub: "user-2",
          role: "authenticated",
          app_metadata: { provider: "email", providers: ["email"], role: "traveler" },
        },
        "traveler",
      ),
    ).toEqual({
      sub: "user-2",
      role: "authenticated",
      app_metadata: {
        provider: "email",
        providers: ["email"],
        role: "traveler",
      },
    });
  });

  it("overwrites stale app_metadata.role from profiles.role", () => {
    expect(
      mergeProfileRoleIntoAccessTokenClaims(
        {
          sub: "user-3",
          role: "authenticated",
          app_metadata: { role: "guide" },
        },
        "admin",
      ),
    ).toMatchObject({
      app_metadata: { role: "admin" },
    });
  });
});
