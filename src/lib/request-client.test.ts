import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { getMessagesRateLimitKey, getTrustedClientIp } from "./request-client";

describe("getTrustedClientIp", () => {
  it("ignores spoofed x-forwarded-for on a direct connection", () => {
    const request = new NextRequest("http://localhost:3000/api/messages/threads", {
      headers: {
        "x-forwarded-for": "203.0.113.50",
      },
    });

    expect(getTrustedClientIp(request)).toBe("direct");
  });

  it("uses x-real-ip when the request is behind a trusted proxy", () => {
    const request = new NextRequest("https://provodnik.app/api/messages/threads", {
      headers: {
        "x-forwarded-host": "provodnik.app",
        "x-forwarded-proto": "https",
        "x-real-ip": "198.51.100.10",
        "x-forwarded-for": "203.0.113.50, 198.51.100.10",
      },
    });

    expect(getTrustedClientIp(request)).toBe("198.51.100.10");
  });

  it("falls back to the last forwarded hop when only x-forwarded-for is present", () => {
    const request = new NextRequest("https://vps.provodnik.app/api/messages/threads", {
      headers: {
        "x-forwarded-host": "vps.provodnik.app",
        "x-forwarded-for": "203.0.113.50, 198.51.100.22",
      },
    });

    expect(getTrustedClientIp(request)).toBe("198.51.100.22");
  });
});

describe("getMessagesRateLimitKey", () => {
  it("keys authenticated message traffic per user", () => {
    expect(getMessagesRateLimitKey("user-1")).toBe("api:messages:user:user-1");
  });
});
