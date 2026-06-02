import { describe, expect, test } from "vitest";
import { resolvePostAuthRedirectPath, safeRedirectPath } from "./safe-redirect";

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

describe("resolvePostAuthRedirectPath", () => {
  test("returns role dashboard when next is absent", () => {
    expect(resolvePostAuthRedirectPath("traveler", null)).toBe("/traveler/requests");
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
      "/traveler/requests",
    );
  });

  test("returns null when role is missing", () => {
    expect(resolvePostAuthRedirectPath(null, "/messages")).toBeNull();
  });
});
