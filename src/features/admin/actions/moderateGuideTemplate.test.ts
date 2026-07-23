import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient, createSupabaseAdminClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  createSupabaseAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

import {
  approveGuideTemplate,
  rejectGuideTemplate,
} from "@/features/admin/actions/moderateGuideTemplate";

function makeSupabase(opts: {
  user?: { id: string; app_metadata?: Record<string, unknown> } | null;
  profile?: { role: string; account_status: string } | null;
}) {
  const user = opts.user ?? null;
  const profile = opts.profile ?? null;

  const authGetUser = vi.fn().mockResolvedValue({
    data: { user },
    error: null,
  });

  const profileMaybeSingle = vi.fn().mockResolvedValue({
    data: profile,
    error: null,
  });
  const profileSelectEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
  const profileSelect = vi.fn(() => ({ eq: profileSelectEq }));

  const fromFn = vi.fn((table: string) => {
    if (table === "profiles") {
      return { select: profileSelect };
    }
    return { select: profileSelect };
  });

  createSupabaseServerClient.mockResolvedValue({
    auth: { getUser: authGetUser },
    from: fromFn,
  });
}

function makeAdminClient() {
  const templateUpdateMaybeSingle = vi.fn().mockResolvedValue({ data: { id: "template-1" }, error: null });
  const templateUpdateSelect = vi.fn(() => ({ maybeSingle: templateUpdateMaybeSingle }));
  const templateUpdateEqStatus = vi.fn(() => ({ select: templateUpdateSelect }));
  const templateUpdateEqId = vi.fn(() => ({ eq: templateUpdateEqStatus }));
  const templateUpdate = vi.fn(() => ({ eq: templateUpdateEqId }));
  const from = vi.fn(() => ({ update: templateUpdate }));

  return { from, templateUpdate, templateUpdateMaybeSingle };
}

describe("approveGuideTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies a suspended admin and never creates trusted write authority", async () => {
    makeSupabase({
      user: { id: "admin-1", app_metadata: { role: "admin" } },
      profile: { role: "admin", account_status: "suspended" },
    });

    await expect(approveGuideTemplate("template-1")).rejects.toThrow(
      "Доступ администратора заблокирован.",
    );

    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("publishes the template when the admin session is active", async () => {
    makeSupabase({
      user: { id: "admin-1", app_metadata: { role: "admin" } },
      profile: { role: "admin", account_status: "active" },
    });
    const { from, templateUpdate } = makeAdminClient();
    createSupabaseAdminClient.mockReturnValue({ from });

    await expect(approveGuideTemplate("template-1")).resolves.toEqual({ success: true });

    expect(createSupabaseAdminClient).toHaveBeenCalledOnce();
    expect(templateUpdate).toHaveBeenCalledWith({
      status: "published",
      rejection_reason: null,
    });
  });

  it("reports already processed when zero rows are updated", async () => {
    makeSupabase({
      user: { id: "admin-1", app_metadata: { role: "admin" } },
      profile: { role: "admin", account_status: "active" },
    });
    const { from, templateUpdateMaybeSingle } = makeAdminClient();
    templateUpdateMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    createSupabaseAdminClient.mockReturnValue({ from });

    await expect(approveGuideTemplate("template-1")).resolves.toEqual({
      success: false,
      error: "Экскурсия уже обработана.",
      alreadyProcessed: true,
    });
  });
});

describe("rejectGuideTemplate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies a suspended admin and never creates trusted write authority", async () => {
    makeSupabase({
      user: { id: "admin-1", app_metadata: { role: "admin" } },
      profile: { role: "admin", account_status: "suspended" },
    });

    await expect(rejectGuideTemplate("template-1", "причина")).rejects.toThrow(
      "Доступ администратора заблокирован.",
    );

    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("rejects the template when the admin session is active", async () => {
    makeSupabase({
      user: { id: "admin-1", app_metadata: { role: "admin" } },
      profile: { role: "admin", account_status: "active" },
    });
    const { from, templateUpdate } = makeAdminClient();
    createSupabaseAdminClient.mockReturnValue({ from });

    await expect(
      rejectGuideTemplate("template-1", "  Фото не соответствует маршруту  "),
    ).resolves.toEqual({ success: true });

    expect(createSupabaseAdminClient).toHaveBeenCalledOnce();
    expect(templateUpdate).toHaveBeenCalledWith({
      status: "rejected",
      rejection_reason: "Фото не соответствует маршруту",
    });
  });

  it("refuses an empty reason instead of rejecting silently", async () => {
    makeSupabase({
      user: { id: "admin-1", app_metadata: { role: "admin" } },
      profile: { role: "admin", account_status: "active" },
    });

    await expect(rejectGuideTemplate("template-1", "   ")).resolves.toEqual({
      success: false,
      error: "Укажите причину отклонения.",
    });

    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });
});
