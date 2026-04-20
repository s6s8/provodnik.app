import { describe, expect, test } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

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
