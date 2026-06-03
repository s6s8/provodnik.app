import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseAdminClient,
  getResendClient,
  headersMock,
  rateLimitMock,
} = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  getResendClient: vi.fn(),
  headersMock: vi.fn(),
  rateLimitMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: rateLimitMock,
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

vi.mock("@/lib/email/resend-client", () => ({
  getResendClient,
}));

vi.mock("@/lib/env", () => ({
  getSiteUrl: () => "https://example.test",
}));

import { sendPasswordResetEmail } from "./actions";

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue({
      get: (name: string) => (name === "x-real-ip" ? "203.0.113.5" : null),
    });
    rateLimitMock
      .mockResolvedValueOnce({ success: true, remaining: 4 })
      .mockResolvedValueOnce({ success: false, remaining: 0 });
    createSupabaseAdminClient.mockReturnValue({
      auth: {
        admin: {
          generateLink: vi.fn(),
        },
      },
    });
    getResendClient.mockReturnValue({
      emails: {
        send: vi.fn(),
      },
    });
  });

  it("keys the email limiter with the normalized email", async () => {
    await sendPasswordResetEmail(" USER@Example.COM ");

    expect(rateLimitMock).toHaveBeenNthCalledWith(
      1,
      "forgot-password:user@example.com",
      5,
      3600,
    );
  });
});
