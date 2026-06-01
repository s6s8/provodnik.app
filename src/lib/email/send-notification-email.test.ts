import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseAdminClient, resendSend } = vi.hoisted(() => ({
  createSupabaseAdminClient: vi.fn(),
  resendSend: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

vi.mock("@/lib/email/resend-client", () => ({
  getResendClient: () => ({
    emails: {
      send: resendSend,
    },
  }),
}));

import { sendNotificationEmail } from "@/lib/email/send-notification-email";

function createAdminClient() {
  const insert = vi.fn();

  const adminClient = {
    from: vi.fn(() => ({
      insert,
    })),
  };

  return { adminClient, insert };
}

const emailArgs = {
  kind: "new_offer",
  entityId: "offer-1",
  to: "dev+traveller@rgx.ge",
  subject: "Новое предложение",
  html: "<p>Новое предложение</p>",
};

describe("sendNotificationEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("does not insert an email log when the provider send fails", async () => {
    const { adminClient, insert } = createAdminClient();
    createSupabaseAdminClient.mockReturnValue(adminClient);
    resendSend.mockResolvedValue({
      data: null,
      error: { message: "domain is not verified" },
    });

    await sendNotificationEmail(emailArgs);

    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not insert an email log when the provider returns no message id", async () => {
    const { adminClient, insert } = createAdminClient();
    createSupabaseAdminClient.mockReturnValue(adminClient);
    resendSend.mockResolvedValue({
      data: {},
      error: null,
    });

    await sendNotificationEmail(emailArgs);

    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts the sent email log with the correct recipient after provider success", async () => {
    const { adminClient, insert } = createAdminClient();
    createSupabaseAdminClient.mockReturnValue(adminClient);
    insert.mockResolvedValue({ error: null });
    resendSend.mockResolvedValue({
      data: { id: "email_123" },
      error: null,
    });

    await sendNotificationEmail(emailArgs);

    expect(resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "dev+traveller@rgx.ge",
        subject: "Новое предложение",
      }),
    );
    expect(insert).toHaveBeenCalledWith({
      kind: "new_offer",
      entity_id: "offer-1",
      recipient: "dev+traveller@rgx.ge",
      sent_at: expect.any(String),
    });
    expect(resendSend.mock.invocationCallOrder[0]).toBeLessThan(
      insert.mock.invocationCallOrder[0],
    );
  });

  it("treats duplicate post-send log inserts as already sent", async () => {
    const { adminClient, insert } = createAdminClient();
    createSupabaseAdminClient.mockReturnValue(adminClient);
    insert.mockResolvedValue({
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    });
    resendSend.mockResolvedValue({
      data: { id: "email_123" },
      error: null,
    });

    await sendNotificationEmail(emailArgs);

    expect(resendSend).toHaveBeenCalledOnce();
    expect(console.error).not.toHaveBeenCalledWith(
      "[notif-email] log insert error:",
      expect.any(String),
    );
  });
});
