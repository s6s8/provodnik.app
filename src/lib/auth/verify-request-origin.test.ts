import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { isSameOriginPost } from "./verify-request-origin";

describe("isSameOriginPost", () => {
  it("accepts a same-origin POST", () => {
    const request = new NextRequest("https://provodnik.app/api/auth/signout", {
      method: "POST",
      headers: {
        origin: "https://provodnik.app",
        "x-forwarded-host": "provodnik.app",
        "x-forwarded-proto": "https",
      },
    });

    expect(isSameOriginPost(request)).toBe(true);
  });

  it("rejects a cross-site POST with a foreign Origin", () => {
    const request = new NextRequest("https://provodnik.app/api/auth/signout", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "x-forwarded-host": "provodnik.app",
        "x-forwarded-proto": "https",
      },
    });

    expect(isSameOriginPost(request)).toBe(false);
  });

  it("accepts a same-site Referer when Origin is absent", () => {
    const request = new NextRequest("https://provodnik.app/api/auth/signout", {
      method: "POST",
      headers: {
        referer: "https://provodnik.app/account",
        "x-forwarded-host": "provodnik.app",
        "x-forwarded-proto": "https",
      },
    });

    expect(isSameOriginPost(request)).toBe(true);
  });
});
