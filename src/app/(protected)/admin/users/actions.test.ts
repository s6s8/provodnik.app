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
  const from = vi.fn(() => ({ update: vi.fn(() => ({ eq: updateEq })) }));
  return {
    client: { auth: { admin: { deleteUser, updateUserById } }, from },
    deleteUser,
    updateUserById,
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
});
