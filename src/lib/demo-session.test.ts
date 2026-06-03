import { describe, expect, it } from "vitest";

import { parseDemoSessionCookieValue, serializeDemoSessionCookieValue } from "./demo-session";

describe("demo session cookie", () => {
  it("round-trips a demo session", () => {
    const session = {
      mode: "demo" as const,
      role: "traveler" as const,
      createdAt: "2026-06-03T00:00:00.000Z",
    };

    expect(parseDemoSessionCookieValue(serializeDemoSessionCookieValue(session))).toEqual(session);
  });

  it("returns null for malformed percent encoding", () => {
    expect(parseDemoSessionCookieValue("%E0%A4%A")).toBeNull();
  });
});
