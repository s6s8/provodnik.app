import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/features/disputes/components/dispute-admin-resolve", () => ({
  DisputeAdminResolve: () => <div>Resolve</div>,
}));

vi.mock("@/features/disputes/dispute-message-actions", () => ({
  postDisputeMessage: vi.fn(),
}));

import { DisputeThread } from "./DisputeThread";

const dispute = {
  id: "dispute-1",
  booking_id: "booking-1",
  opened_by: "traveler-1",
  status: "open",
  resolution_summary: null,
  reason: null,
  created_at: "2026-06-10T10:00:00.000Z",
  resolved_at: null,
};

const bookingRow = {
  id: "booking-1",
  traveler_request: { destination: "Карелия" },
};

type EventRow = {
  id: string;
  event_type: string;
  payload: unknown;
  created_at: string;
  actor_id: string;
};

function makeChain(result: unknown, terminal: "maybeSingle" | "order") {
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
  };
  builder[terminal] = vi.fn(() => Promise.resolve(result));
  return builder;
}

function mockClient(events: EventRow[]) {
  createSupabaseServerClientMock.mockResolvedValue({
    from: vi.fn((table: string) => {
      if (table === "disputes") return makeChain({ data: dispute, error: null }, "maybeSingle");
      if (table === "dispute_events")
        return makeChain({ data: events, error: null }, "order");
      if (table === "bookings")
        return makeChain({ data: bookingRow, error: null }, "maybeSingle");
      return makeChain({ data: null, error: null }, "maybeSingle");
    }),
  });
}

function eventOf(eventType: string): EventRow {
  return {
    id: `event-${eventType}`,
    event_type: eventType,
    payload: null,
    created_at: "2026-06-10T11:00:00.000Z",
    actor_id: "traveler-1",
  };
}

describe("DisputeThread event labels", () => {
  beforeEach(() => {
    createSupabaseServerClientMock.mockReset();
  });

  it("maps dispute_opened to «Спор открыт»", async () => {
    mockClient([eventOf("dispute_opened")]);

    const ui = await DisputeThread({ disputeId: "dispute-1" });
    render(ui);

    expect(screen.getByText("Спор открыт")).toBeInTheDocument();
  });

  it("renders an unknown event slug verbatim without crashing", async () => {
    mockClient([eventOf("weird_unknown_event")]);

    const ui = await DisputeThread({ disputeId: "dispute-1" });
    render(ui);

    expect(screen.getByText("weird_unknown_event")).toBeInTheDocument();
  });

  it("renders a comment event as a message bubble with body and role label", async () => {
    mockClient([
      {
        id: "event-comment",
        event_type: "comment",
        payload: { body: "Подскажите статус возврата", role: "traveler" },
        created_at: "2026-06-10T12:00:00.000Z",
        actor_id: "traveler-1",
      },
    ]);

    const ui = await DisputeThread({ disputeId: "dispute-1" });
    render(ui);

    expect(screen.getByText("Подскажите статус возврата")).toBeInTheDocument();
    expect(screen.getByText("Путешественник")).toBeInTheDocument();
  });

  it("renders a support comment with the «Поддержка» role label", async () => {
    mockClient([
      {
        id: "event-comment-admin",
        event_type: "comment",
        payload: { body: "Мы проверяем вашу жалобу", role: "admin" },
        created_at: "2026-06-10T12:30:00.000Z",
        actor_id: "admin-1",
      },
    ]);

    const ui = await DisputeThread({ disputeId: "dispute-1" });
    render(ui);

    expect(screen.getByText("Мы проверяем вашу жалобу")).toBeInTheDocument();
    expect(screen.getByText("Поддержка")).toBeInTheDocument();
  });

  it("renders the composer (textarea + «Отправить») for an open dispute", async () => {
    mockClient([eventOf("dispute_opened")]);

    const ui = await DisputeThread({ disputeId: "dispute-1" });
    render(ui);

    expect(screen.getByRole("button", { name: "Отправить" })).toBeInTheDocument();
    expect(
      screen.getByLabelText("Сообщение по спору"),
    ).toBeInTheDocument();
  });

  it("replaces the read-only «недоступно» notice with the composer", async () => {
    mockClient([eventOf("dispute_opened")]);

    const ui = await DisputeThread({ disputeId: "dispute-1" });
    render(ui);

    expect(
      screen.queryByText(/Дополнение к спору временно недоступно/),
    ).not.toBeInTheDocument();
  });
});
