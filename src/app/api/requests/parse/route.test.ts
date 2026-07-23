import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { rateLimit, checkGlobalBudget } = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  checkGlobalBudget: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit,
  checkGlobalBudget,
}));

import { POST } from "./route";

describe("POST /api/requests/parse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimit.mockResolvedValue({ success: true, remaining: 19 });
    checkGlobalBudget.mockResolvedValue({ allowed: true });
  });

  it("rate-limits by trusted client IP behind a proxy", async () => {
    const request = new NextRequest("https://provodnik.app/api/requests/parse", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-host": "provodnik.app",
        "x-real-ip": "198.51.100.10",
        "x-forwarded-for": "203.0.113.50, 198.51.100.10",
      },
      body: JSON.stringify({
        userText: "хочу в Элисту",
        todayMoscow: "2026-07-24",
      }),
    });

    await POST(request);

    expect(rateLimit).toHaveBeenCalledWith(
      "api:requests:parse:198.51.100.10",
      20,
      60,
    );
  });

  it("ignores spoofed x-forwarded-for without proxy metadata", async () => {
    const request = new NextRequest("http://localhost:3000/api/requests/parse", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.50",
      },
      body: JSON.stringify({
        userText: "хочу в Элисту",
        todayMoscow: "2026-07-24",
      }),
    });

    await POST(request);

    expect(rateLimit).toHaveBeenCalledWith("api:requests:parse:direct", 20, 60);
  });
});
