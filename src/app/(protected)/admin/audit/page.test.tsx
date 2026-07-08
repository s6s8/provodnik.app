import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, requireAdminSession } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/supabase/moderation", () => ({
  requireAdminSession,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import AdminAuditPage from "./page";

function createQueryResult(data: unknown[]) {
  const result = { data, error: null };
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.ilike = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.range = vi.fn().mockResolvedValue(result);
  builder.limit = vi.fn().mockResolvedValue(result);

  return builder;
}

describe("AdminAuditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies non-admin callers before reading audit tables", async () => {
    const adminClient = {
      from: vi.fn(() => createQueryResult([])),
    };
    requireAdminSession.mockRejectedValue(new Error("Доступ только для администраторов."));

    await expect(AdminAuditPage()).rejects.toThrow("Доступ только для администраторов.");

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(adminClient.from).not.toHaveBeenCalled();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("requires an admin session and reads audit entries through the admin client", async () => {
    const actionsQuery = createQueryResult([
      {
        id: "action-1",
        created_at: "2026-06-02T10:00:00.000Z",
        decision: "approve",
        note: "Документы проверены",
        admin_id: "admin-1",
        admin: { full_name: "Анна Админ", email: "admin@example.com" },
        case: {
          id: "case-1",
          subject_type: "guide_profile",
          guide_id: "guide-1",
          listing_id: null,
          review_id: null,
        },
      },
    ]);
    const listingEventsQuery = createQueryResult([
      {
        id: "event-1",
        created_at: "2026-06-01T10:00:00.000Z",
        from_status: "pending_review",
        to_status: "published",
        reason: "Описание подтверждено",
        listing_id: "listing-1",
        actor_id: "admin-1",
        actor: { full_name: "Анна Админ", email: "admin@example.com" },
        listing: { title: "Ладога на каяке" },
      },
    ]);
    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "moderation_actions") return actionsQuery;
        if (table === "listing_moderation_events") return listingEventsQuery;
        return createQueryResult([]); // guide_availability_events
      }),
    };
    const serverClient = {
      from: vi.fn(() => createQueryResult([])),
    };
    requireAdminSession.mockResolvedValue({ adminClient });
    createSupabaseServerClient.mockResolvedValue(serverClient);

    const ui = await AdminAuditPage();
    render(ui);

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(adminClient.from).toHaveBeenCalledWith("moderation_actions");
    expect(adminClient.from).toHaveBeenCalledWith("listing_moderation_events");
    expect(serverClient.from).not.toHaveBeenCalled();
    expect(screen.getAllByText("Анна Админ")).toHaveLength(2);
    expect(screen.getByText(/Документы проверены/)).toBeInTheDocument();
    expect(screen.getByText("Листинг «Ладога на каяке»")).toBeInTheDocument();
  });

  it("surfaces guide availability pause events with a link to the guide", async () => {
    const availabilityQuery = createQueryResult([
      {
        id: "gae-1",
        created_at: "2026-06-03T10:00:00.000Z",
        available: false,
        guide_id: "guide-9",
        actor_id: "guide-9",
        actor: { full_name: "Гид Тест", email: "guide@example.com" },
      },
    ]);
    const adminClient = {
      from: vi.fn((table: string) => {
        if (table === "guide_availability_events") return availabilityQuery;
        return createQueryResult([]);
      }),
    };
    requireAdminSession.mockResolvedValue({ adminClient });

    const ui = await AdminAuditPage();
    render(ui);

    expect(adminClient.from).toHaveBeenCalledWith("guide_availability_events");
    expect(screen.getByText("Приём приостановлен")).toBeInTheDocument();
    expect(screen.getByText("Доступность гида")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(
      links.some((l) => l.getAttribute("href") === "/admin/guides/guide-9"),
    ).toBe(true);
  });
});
