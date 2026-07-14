import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createNotification,
  createSupabaseAdminClient,
  createSupabaseServerClient,
  sendNotificationEmail,
} = vi.hoisted(() => ({
  createNotification: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  sendNotificationEmail: vi.fn(),
}));

vi.mock("@/lib/notifications/create-notification", () => ({
  createNotification,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/env", () => ({
  getSiteUrl: () => "https://provodnik.test",
}));

vi.mock("@/lib/email/send-notification-email", () => ({
  sendNotificationEmail,
}));

vi.mock("@/lib/email/templates/notification-emails", () => ({
  renderNewOfferEmail: vi.fn(),
  renderBookingCreatedEmail: vi.fn(),
  renderBookingCancelledEmail: ({ bookingUrl }: { bookingUrl: string }) => ({
    subject: "Бронирование отменено",
    html: bookingUrl,
  }),
  renderNewRequestEmail: ({ destination, participants }: { destination: string; participants: number }) => ({
    subject: `Новый запрос: ${destination}`,
    html: `${destination}/${participants}`,
  }),
}));

import { notifyBookingCancelled, notifyGuidesNewRequest } from "./triggers";

const bookingId = "11111111-1111-4111-8111-111111111111";
const travelerId = "22222222-2222-4222-8222-222222222222";
const guideId = "33333333-3333-4333-8333-333333333333";

afterEach(() => {
  vi.restoreAllMocks();
});

function createQuery(table: string, data: Record<string, unknown>) {
  let selected = "";
  const filters: Record<string, unknown> = {};
  const query = {
    select: vi.fn((columns: string) => {
      selected = columns;
      return query;
    }),
    eq: vi.fn((column: string, value: unknown) => {
      filters[column] = value;
      return query;
    }),
    single: vi.fn(async () => ({
      data: data.bookings,
      error: null,
    })),
    maybeSingle: vi.fn(async () => {
      if (table === "profiles" && selected === "email") {
        return {
          data: { email: (data.emails as Record<string, string>)[filters.id as string] },
          error: null,
        };
      }
      if (table === "profiles" && selected === "notification_prefs") {
        return {
          data: {
            notification_prefs: (data.travelerPrefs as Record<string, unknown>)[
              filters.id as string
            ],
          },
          error: null,
        };
      }
      if (table === "guide_profiles" && selected === "notification_prefs") {
        return {
          data: {
            notification_prefs: (data.guidePrefs as Record<string, unknown>)[
              filters.user_id as string
            ],
          },
          error: null,
        };
      }
      return { data: null, error: null };
    }),
  };
  return query;
}

describe("notifyBookingCancelled", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createNotification.mockResolvedValue(undefined);
    sendNotificationEmail.mockResolvedValue(undefined);

    const data = {
      bookings: {
        id: bookingId,
        traveler_id: travelerId,
        guide_id: guideId,
      },
      emails: {
        [travelerId]: "traveler@example.test",
        [guideId]: "guide@example.test",
      },
      travelerPrefs: {
        [travelerId]: { "traveler.booking_status.email": false },
      },
      guidePrefs: {
        [guideId]: { "guide.booking_status.email": true },
      },
    };

    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn((table: string) => createQuery(table, data)),
    });
    createSupabaseAdminClient.mockReturnValue({
      from: vi.fn((table: string) => createQuery(table, data)),
    });
  });

  it("honors each cancel recipient's email preference and routes guide email to guide bookings", async () => {
    await notifyBookingCancelled(bookingId, "admin");

    expect(sendNotificationEmail).toHaveBeenCalledOnce();
    expect(sendNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "guide@example.test",
        html: `https://provodnik.test/guide/bookings/${bookingId}`,
      }),
    );
  });
});

describe("notifyGuidesNewRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createNotification.mockResolvedValue(undefined);
  });

  it("attempts every guide notification and throws an aggregate error for failures", async () => {
    const request = {
      id: bookingId,
      destination: "Сочи",
      interests: ["mountains"],
      participants_count: 2,
    };
    const candidates = [
      { user_id: travelerId, specialties: ["mountains"], max_group_size: 4 },
      { user_id: guideId, specialties: ["mountains"], max_group_size: 4 },
    ];
    createNotification
      .mockRejectedValueOnce(new Error("first notification failed"))
      .mockResolvedValueOnce(undefined);

    const requestQuery = {
      select: vi.fn(() => requestQuery),
      eq: vi.fn(() => requestQuery),
      single: vi.fn(async () => ({ data: request, error: null })),
    };
    const guidesQuery = {
      select: vi.fn(() => guidesQuery),
      eq: vi.fn(() => guidesQuery),
      ilike: vi.fn(() => guidesQuery),
      or: vi.fn(async () => ({ data: candidates, error: null })),
    };

    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "traveler_requests") return requestQuery;
        if (table === "guide_profiles") return guidesQuery;
        throw new Error(`unexpected table ${table}`);
      }),
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(notifyGuidesNewRequest(bookingId)).rejects.toThrow(AggregateError);
    expect(createNotification).toHaveBeenCalledTimes(2);
    expect(console.error).toHaveBeenCalledWith(
      "[notifyGuidesNewRequest] notification failures:",
      expect.any(AggregateError),
    );
  });
});

// Item 8: a matching guide used to get an in-app bell and nothing else. If they were
// not in the app, the request went unanswered.
describe("notifyGuidesNewRequest email", () => {
  const guideTwo = "44444444-4444-4444-8444-444444444444";

  function mount(guidePrefs: Record<string, unknown>) {
    const request = {
      id: bookingId,
      destination: "Элиста",
      interests: ["mountains"],
      participants_count: 2,
    };
    const candidates = [
      { user_id: guideId, specialties: ["mountains"], max_group_size: 4 },
      { user_id: guideTwo, specialties: ["mountains"], max_group_size: 4 },
    ];
    const data = {
      emails: { [guideId]: "guide-one@example.test", [guideTwo]: "guide-two@example.test" },
      travelerPrefs: {},
      guidePrefs,
    };

    const requestQuery = {
      select: vi.fn(() => requestQuery),
      eq: vi.fn(() => requestQuery),
      single: vi.fn(async () => ({ data: request, error: null })),
    };
    const guidesQuery = {
      select: vi.fn(() => guidesQuery),
      eq: vi.fn(() => guidesQuery),
      ilike: vi.fn(() => guidesQuery),
      or: vi.fn(async () => ({ data: candidates, error: null })),
    };

    createSupabaseServerClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "traveler_requests") return requestQuery;
        if (table === "guide_profiles") return guidesQuery;
        throw new Error(`unexpected table ${table}`);
      }),
    });
    createSupabaseAdminClient.mockReturnValue({
      from: vi.fn((table: string) => createQuery(table, data)),
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    createNotification.mockResolvedValue(undefined);
    sendNotificationEmail.mockResolvedValue(undefined);
  });

  it("emails every matching guide under a per-recipient idempotency key", async () => {
    mount({});

    await notifyGuidesNewRequest(bookingId);

    expect(sendNotificationEmail).toHaveBeenCalledTimes(2);
    // notification_email_log is PRIMARY KEY (kind, entity_id). A bare requestId here
    // would let guide one's row take the key and guide two's mail would be dropped as
    // "already sent" — silently, with no error and no log. The recipient MUST be in it.
    const entityIds = sendNotificationEmail.mock.calls.map((c) => c[0].entityId);
    expect(entityIds).toEqual([`${bookingId}:${guideId}`, `${bookingId}:${guideTwo}`]);
    expect(new Set(entityIds).size).toBe(2);
    expect(sendNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "new_request", to: "guide-one@example.test" }),
    );
  });

  it("respects a guide who turned new-request email off", async () => {
    mount({ [guideId]: { "guide.new_request.email": false } });

    await notifyGuidesNewRequest(bookingId);

    expect(sendNotificationEmail).toHaveBeenCalledOnce();
    expect(sendNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "guide-two@example.test" }),
    );
  });

  it("still delivers the in-app notification when the email throws", async () => {
    mount({});
    sendNotificationEmail.mockRejectedValue(new Error("resend is down"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(notifyGuidesNewRequest(bookingId)).resolves.toBeUndefined();
    expect(createNotification).toHaveBeenCalledTimes(2);
  });
});
