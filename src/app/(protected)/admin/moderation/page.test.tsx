import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, requireAdminSession } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/features/admin/components/ModerationQueueItem", () => ({
  ModerationQueueList: ({ listings }: { listings: Array<{ title: string }> }) => (
    <div data-testid="moderation-queue">
      {listings.map((listing) => (
        <span key={listing.title}>{listing.title}</span>
      ))}
    </div>
  ),
}));
vi.mock("@/lib/supabase/moderation", () => ({
  requireAdminSession,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import ModerationQueuePage from "./page";

function createQueryResult(data: unknown[]) {
  const limit = vi.fn().mockResolvedValue({ data, error: null });
  const order = vi.fn(() => ({ limit }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));

  return { select, eq, order, limit };
}

describe("ModerationQueuePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires an admin session and reads pending moderation data through the admin client", async () => {
    const listingsQuery = createQueryResult([
      {
        id: "listing-1",
        title: "Ладога на каяке",
        region: "Карелия",
        exp_type: "tour",
        guide_id: "guide-1",
        description: "Маршрут",
        created_at: "2026-06-01T10:00:00.000Z",
        status: "pending_review",
      },
    ]);
    const repliesQuery = createQueryResult([
      {
        id: "reply-1",
        review_id: "review-1",
        body: "Спасибо за отзыв",
        submitted_at: "2026-06-02T10:00:00.000Z",
      },
    ]);
    const adminClient = {
      from: vi.fn((table: string) =>
        table === "listings" ? listingsQuery : repliesQuery,
      ),
    };
    const serverClient = {
      from: vi.fn(() => createQueryResult([])),
    };
    requireAdminSession.mockResolvedValue({ adminClient });
    createSupabaseServerClient.mockResolvedValue(serverClient);

    const ui = await ModerationQueuePage();
    render(ui);

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(adminClient.from).toHaveBeenCalledWith("listings");
    expect(adminClient.from).toHaveBeenCalledWith("review_replies");
    expect(serverClient.from).not.toHaveBeenCalled();
    expect(screen.getByTestId("moderation-queue")).toHaveTextContent("Ладога на каяке");
    expect(screen.getByText("Спасибо за отзыв")).toBeInTheDocument();
  });
});
