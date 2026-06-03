import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DisputeDetail } from "@/lib/supabase/disputes";

const { getDispute, readAuthContextFromServer, requireAdminSession } = vi.hoisted(() => ({
  getDispute: vi.fn(),
  readAuthContextFromServer: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));
vi.mock("@/features/admin/components/disputes/dispute-case-detail", () => ({
  DisputeCaseDetail: ({
    dispute,
    adminId,
  }: {
    dispute: DisputeDetail;
    adminId: string;
  }) => (
    <div>
      <span>{dispute.reason}</span>
      <span>admin:{adminId}</span>
    </div>
  ),
}));
vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer,
}));
vi.mock("@/lib/supabase/disputes", () => ({
  getDispute,
}));
vi.mock("@/lib/supabase/moderation", () => ({
  requireAdminSession,
}));

import AdminDisputeCasePage from "./page";

const dispute = {
  id: "11111111-1111-4111-8111-111111111111",
  bookingId: "booking-1",
  status: "open",
  reason: "Гид не пришёл на встречу",
  summary: null,
  requestedOutcome: null,
  payoutFrozen: false,
  assignedAdminId: null,
  createdAt: "2026-06-01T10:00:00.000Z",
  updatedAt: "2026-06-01T10:00:00.000Z",
  booking: null,
  openedBy: "traveler-1",
  resolutionSummary: null,
  resolvedAt: null,
  notes: [],
} satisfies DisputeDetail;

describe("AdminDisputeCasePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies non-admin callers before loading a dispute", async () => {
    readAuthContextFromServer.mockResolvedValue({ userId: "traveler-1", role: "traveler" });
    getDispute.mockResolvedValue(dispute);
    requireAdminSession.mockRejectedValue(new Error("Доступ только для администраторов."));

    await expect(
      AdminDisputeCasePage({
        params: Promise.resolve({ caseId: dispute.id }),
      }),
    ).rejects.toThrow("Доступ только для администраторов.");

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(getDispute).not.toHaveBeenCalled();
    expect(readAuthContextFromServer).not.toHaveBeenCalled();
  });

  it("requires an admin session and renders the dispute for that admin", async () => {
    requireAdminSession.mockResolvedValue({ adminId: "admin-1", adminClient: {} });
    readAuthContextFromServer.mockResolvedValue({ userId: "traveler-1", role: "traveler" });
    getDispute.mockResolvedValue(dispute);

    const ui = await AdminDisputeCasePage({
      params: Promise.resolve({ caseId: dispute.id }),
    });
    render(ui);

    expect(requireAdminSession).toHaveBeenCalledOnce();
    expect(readAuthContextFromServer).not.toHaveBeenCalled();
    expect(getDispute).toHaveBeenCalledWith(dispute.id);
    expect(screen.getByText("Гид не пришёл на встречу")).toBeInTheDocument();
    expect(screen.getByText("admin:admin-1")).toBeInTheDocument();
  });
});
