import { describe, expect, test } from "vitest";
import {
  buildAuthLoginRedirect,
  isAdminWorkspacePath,
  resolvePostAuthRedirectPath,
  resolveSafeNextPath,
  safeRedirectPath,
} from "./safe-redirect";

describe("safeRedirectPath", () => {
  test("returns / for null", () => {
    expect(safeRedirectPath(null)).toBe("/");
  });
  test("returns / for empty string", () => {
    expect(safeRedirectPath("")).toBe("/");
  });
  test("allows simple relative path", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
  });
  test("allows nested relative path", () => {
    expect(safeRedirectPath("/traveler/requests/123")).toBe("/traveler/requests/123");
  });
  test("blocks https absolute URL", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/");
  });
  test("blocks http absolute URL", () => {
    expect(safeRedirectPath("http://evil.com")).toBe("/");
  });
  test("blocks protocol-relative URL", () => {
    expect(safeRedirectPath("//evil.com/path")).toBe("/");
  });
  test("blocks path not starting with /", () => {
    expect(safeRedirectPath("evil.com")).toBe("/");
  });
  test("blocks URL that resolves to external origin", () => {
    expect(safeRedirectPath("https://evil.com/auth/confirm")).toBe("/");
  });
});

describe("buildAuthLoginRedirect", () => {
  test("returns /auth when next is absent or unsafe", () => {
    expect(buildAuthLoginRedirect(null)).toBe("/auth");
    expect(buildAuthLoginRedirect("https://evil.com")).toBe("/auth");
  });

  test("encodes a safe return path", () => {
    expect(buildAuthLoginRedirect("/traveler/bookings/booking-1")).toBe(
      "/auth?next=%2Ftraveler%2Fbookings%2Fbooking-1",
    );
    expect(buildAuthLoginRedirect("/messages/thread-1")).toBe(
      "/auth?next=%2Fmessages%2Fthread-1",
    );
  });
});

describe("isAdminWorkspacePath", () => {
  test("detects admin routes and rejects unsafe paths", () => {
    expect(isAdminWorkspacePath("/admin/dashboard")).toBe(true);
    expect(isAdminWorkspacePath("/admin")).toBe(true);
    expect(isAdminWorkspacePath("https://evil.com/admin")).toBe(false);
    expect(isAdminWorkspacePath("/traveler/requests")).toBe(false);
    expect(isAdminWorkspacePath(null)).toBe(false);
  });
});

describe("resolveSafeNextPath", () => {
  test("returns the safe next path when accessible for the role", () => {
    expect(resolveSafeNextPath("guide", "/guide/inbox")).toBe("/guide/inbox");
  });

  test("returns null when next is absent or blank", () => {
    expect(resolveSafeNextPath("guide", null)).toBeNull();
    expect(resolveSafeNextPath("guide", "  ")).toBeNull();
  });

  test("returns null (not the dashboard) when next is rejected", () => {
    expect(resolveSafeNextPath("guide", "https://evil.com")).toBeNull();
    expect(resolveSafeNextPath("guide", "//evil.com")).toBeNull();
    expect(resolveSafeNextPath("guide", "/")).toBeNull();
    expect(resolveSafeNextPath("guide", "/admin")).toBeNull();
  });

  test("returns null when role is missing", () => {
    expect(resolveSafeNextPath(null, "/messages")).toBeNull();
  });
});

describe("resolvePostAuthRedirectPath", () => {
  test("returns role dashboard when next is absent", () => {
    expect(resolvePostAuthRedirectPath("traveler", null)).toBe("/trips");
    expect(resolvePostAuthRedirectPath("guide", undefined)).toBe("/guide");
  });

  test("returns safe messages thread path for travelers when next is set", () => {
    const threadId = "11111111-1111-4111-8111-111111111111";
    expect(resolvePostAuthRedirectPath("traveler", `/messages/${threadId}`)).toBe(
      `/messages/${threadId}`,
    );
  });

  test("falls back to dashboard when next is an open-redirect attempt", () => {
    expect(resolvePostAuthRedirectPath("traveler", "https://evil.com")).toBe(
      "/trips",
    );
  });

  test("falls back to dashboard when next requires another role", () => {
    expect(resolvePostAuthRedirectPath("traveler", "/guide/profile")).toBe(
      "/trips",
    );
  });

  test("allows admins to follow role-gated next paths", () => {
    expect(resolvePostAuthRedirectPath("admin", "/guide/profile")).toBe(
      "/guide/profile",
    );
  });

  test("returns null when role is missing", () => {
    expect(resolvePostAuthRedirectPath(null, "/messages")).toBeNull();
  });
});
