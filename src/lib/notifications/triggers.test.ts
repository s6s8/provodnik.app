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
