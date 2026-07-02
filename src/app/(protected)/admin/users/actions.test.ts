import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  getTargetForGuards: vi.fn(),
  countOtherActiveAdmins: vi.fn(),
  logAdminAudit: vi.fn().mockResolvedValue(undefined),
  createSupabaseServerClient: vi.fn(),
  ensureOpenModerationCase: vi.fn(),
  performModerationAction: vi.fn(),
}));

vi.mock("@/lib/supabase/moderation", () => ({
  requireAdminSession: mocks.requireAdminSession,
  ensureOpenModerationCase: mocks.ensureOpenModerationCase,
  performModerationAction: mocks.performModerationAction,
}));

vi.mock("@/lib/supabase/admin-users", () => ({
  getTargetForGuards: mocks.getTargetForGuards,
  countOtherActiveAdmins: mocks.countOtherActiveAdmins,
  logAdminAudit: mocks.logAdminAudit,
}));

vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  approveGuideAction,
  bulkAction,
  hardDeleteDemoUserAction,
  setAccountStatusAction,
  setUserRoleAction,
} from "./actions";

const ADMIN_ID = "11111111-1111-4111-8111-111111111111";
const TARGET_ID = "22222222-2222-4222-8222-222222222222";

function makeAdminClient() {
  const deleteUser = vi.fn().mockResolvedValue({ error: null });
  const updateUserById = vi.fn().mockResolvedValue({ error: null });
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const profileUpdate = vi.fn(() => ({ eq: updateEq }));
  const guideUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const guideUpdate = vi.fn(() => ({ eq: guideUpdateEq }));
  const guideUpsert = vi.fn().mockResolvedValue({ error: null });
  const guideMaybeSingle = vi.fn().mockResolvedValue({
    data: { user_id: TARGET_ID, verification_status: "submitted" },
    error: null,
  });
  const guideSelectEq = vi.fn(() => ({ maybeSingle: guideMaybeSingle }));
  const guideSelect = vi.fn(() => ({ eq: guideSelectEq }));
  const from = vi.fn((table: string) => {
    if (table === "guide_profiles") {
      return { update: guideUpdate, upsert: guideUpsert, select: guideSelect };
    }
    return { update: profileUpdate };
  });
  return {
    client: { auth: { admin: { deleteUser, updateUserById } }, from },
    deleteUser,
    updateUserById,
    updateEq,
    profileUpdate,
    guideUpdate,
    guideUpdateEq,
    guideUpsert,
    guideMaybeSingle,
    from,
  };
}

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

describe("hardDeleteDemoUserAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses without the exact confirmation text", async () => {
    const { client, deleteUser } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });

    const result = await hardDeleteDemoUserAction(
      null,
      form({ targetUserId: TARGET_ID, confirmText: "delete", reason: "cleanup demo" }),
    );

    expect(result.ok).toBe(false);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("refuses to delete a real (non-demo) user", async () => {
    const { client, deleteUser } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "real@gmail.com",
      role: "traveler",
      accountStatus: "active",
    });

    const result = await hardDeleteDemoUserAction(
      null,
      form({ targetUserId: TARGET_ID, confirmText: "УДАЛИТЬ", reason: "cleanup demo" }),
    );

    expect(result.ok).toBe(false);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("deletes a demo traveler with correct confirmation", async () => {
    const { client, deleteUser } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "demo@example.com",
      role: "traveler",
      accountStatus: "active",
    });

    const result = await hardDeleteDemoUserAction(
      null,
      form({ targetUserId: TARGET_ID, confirmText: "УДАЛИТЬ", reason: "cleanup demo" }),
    );

    expect(result.ok).toBe(true);
    expect(deleteUser).toHaveBeenCalledWith(TARGET_ID);
    expect(mocks.logAdminAudit).toHaveBeenCalled();
  });
});

describe("setAccountStatusAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks acting on your own account", async () => {
    const { client } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: ADMIN_ID,
      email: "admin@provodnik.app",
      role: "admin",
      accountStatus: "active",
    });
    mocks.countOtherActiveAdmins.mockResolvedValue(3);

    const result = await setAccountStatusAction(
      null,
      form({ targetUserId: ADMIN_ID, status: "suspended", reason: "test reason" }),
    );

    expect(result.ok).toBe(false);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });
});

describe("setUserRoleAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("blocks demoting the last active admin", async () => {
    const { client, updateUserById } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "admin2@provodnik.app",
      role: "admin",
      accountStatus: "active",
    });
    mocks.countOtherActiveAdmins.mockResolvedValue(0);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "traveler", reason: "demote test" }),
    );

    expect(result.ok).toBe(false);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("creates an inactive draft guide profile when promoting a traveler to guide", async () => {
    const { client, guideUpsert } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "demo@example.com",
      role: "traveler",
      accountStatus: "active",
    });
    mocks.countOtherActiveAdmins.mockResolvedValue(2);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "guide", reason: "role test" }),
    );

    expect(result.ok).toBe(true);
    expect(guideUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: TARGET_ID,
        verification_status: "draft",
        is_available: false,
      }),
      { onConflict: "user_id" },
    );
  });

  it("removes public availability when demoting a guide", async () => {
    const { client, guideUpdate, guideUpdateEq } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "guide@example.com",
      role: "guide",
      accountStatus: "active",
    });
    mocks.countOtherActiveAdmins.mockResolvedValue(2);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "traveler", reason: "role test" }),
    );

    expect(result.ok).toBe(true);
    expect(guideUpdate).toHaveBeenCalledWith({ is_available: false });
    expect(guideUpdateEq).toHaveBeenCalledWith("user_id", TARGET_ID);
  });

  it("rolls back auth and profile role if guide side-effect sync fails", async () => {
    const { client, guideUpsert, updateUserById, profileUpdate } = makeAdminClient();
    guideUpsert.mockResolvedValueOnce({ error: { message: "boom" } });
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "demo@example.com",
      role: "traveler",
      accountStatus: "active",
    });
    mocks.countOtherActiveAdmins.mockResolvedValue(2);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "guide", reason: "role test" }),
    );

    expect(result.ok).toBe(false);
    expect(updateUserById).toHaveBeenLastCalledWith(TARGET_ID, {
      app_metadata: { role: "traveler" },
    });
    expect(profileUpdate).toHaveBeenLastCalledWith({ role: "traveler" });
  });
});

describe("guide verification actions from admin users", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not approve a suspended guide even if the button/action is invoked", async () => {
    const { client } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "guide@example.com",
      role: "guide",
      accountStatus: "suspended",
    });

    const result = await approveGuideAction(TARGET_ID, null);

    expect(result.ok).toBe(false);
    expect(mocks.ensureOpenModerationCase).not.toHaveBeenCalled();
    expect(mocks.performModerationAction).not.toHaveBeenCalled();
  });

  it("does not report bulk approve as applied when the guide profile is missing", async () => {
    const { client, guideMaybeSingle } = makeAdminClient();
    guideMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "guide@example.com",
      role: "guide",
      accountStatus: "active",
    });

    const result = await bulkAction(null, form({ action: "approve", userIds: TARGET_ID }));

    expect(result.applied).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mocks.ensureOpenModerationCase).not.toHaveBeenCalled();
  });
});
