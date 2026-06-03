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
  const update = vi.fn();
  const match = vi.fn();

  update.mockReturnValue({ match });

  const adminClient = {
    from: vi.fn(() => ({
      insert,
      update,
    })),
  };

  return { adminClient, insert, update, match };
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

  it("reserves the email log before provider send and does not mark sent when the provider fails", async () => {
    const { adminClient, insert, match } = createAdminClient();
    createSupabaseAdminClient.mockReturnValue(adminClient);
    insert.mockResolvedValue({ error: null });
    resendSend.mockResolvedValue({
      data: null,
      error: { message: "domain is not verified" },
    });

    await sendNotificationEmail(emailArgs);

    expect(insert).toHaveBeenCalledWith({
      kind: "new_offer",
      entity_id: "offer-1",
      recipient: "dev+traveller@rgx.ge",
      sent_at: expect.any(String),
    });
    expect(insert.mock.invocationCallOrder[0]).toBeLessThan(
      resendSend.mock.invocationCallOrder[0],
    );
    expect(match).not.toHaveBeenCalled();
  });

  it("reserves the email log before provider send and does not mark sent when the provider returns no message id", async () => {
    const { adminClient, insert, match } = createAdminClient();
    createSupabaseAdminClient.mockReturnValue(adminClient);
    insert.mockResolvedValue({ error: null });
    resendSend.mockResolvedValue({
      data: {},
      error: null,
    });

    await sendNotificationEmail(emailArgs);

    expect(insert).toHaveBeenCalledOnce();
    expect(insert.mock.invocationCallOrder[0]).toBeLessThan(
      resendSend.mock.invocationCallOrder[0],
    );
    expect(match).not.toHaveBeenCalled();
  });

  it("marks the reserved email log as sent after provider success", async () => {
    const { adminClient, insert, update, match } = createAdminClient();
    createSupabaseAdminClient.mockReturnValue(adminClient);
    insert.mockResolvedValue({ error: null });
    match.mockResolvedValue({ error: null });
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
    expect(update).toHaveBeenCalledWith({ sent_at: expect.any(String) });
    expect(match).toHaveBeenCalledWith({
      kind: "new_offer",
      entity_id: "offer-1",
      recipient: "dev+traveller@rgx.ge",
    });
    expect(insert.mock.invocationCallOrder[0]).toBeLessThan(
      resendSend.mock.invocationCallOrder[0],
    );
    expect(resendSend.mock.invocationCallOrder[0]).toBeLessThan(
      update.mock.invocationCallOrder[0],
    );
  });

  it("treats duplicate reservations as already sent without calling the provider", async () => {
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

    expect(resendSend).not.toHaveBeenCalled();
  });

  it("surfaces non-duplicate reservation errors before calling the provider", async () => {
    const { adminClient, insert } = createAdminClient();
    createSupabaseAdminClient.mockReturnValue(adminClient);
    insert.mockResolvedValue({
      error: { code: "42501", message: "permission denied for table notification_email_log" },
    });

    await expect(sendNotificationEmail(emailArgs)).rejects.toThrow(
      "permission denied for table notification_email_log",
    );

    expect(resendSend).not.toHaveBeenCalled();
  });

  it("surfaces sent marker errors after provider success", async () => {
    const { adminClient, insert, match } = createAdminClient();
    createSupabaseAdminClient.mockReturnValue(adminClient);
    insert.mockResolvedValue({ error: null });
    match.mockResolvedValue({
      error: { code: "42501", message: "permission denied for table notification_email_log" },
    });
    resendSend.mockResolvedValue({
      data: { id: "email_123" },
      error: null,
    });

    await expect(sendNotificationEmail(emailArgs)).rejects.toThrow(
      "permission denied for table notification_email_log",
    );

    expect(resendSend).toHaveBeenCalledOnce();
  });
});
