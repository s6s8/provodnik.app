import { beforeEach, describe, expect, it, vi } from "vitest";

import { COPY } from "@/lib/copy";

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
  buildGuideRoleFlipWrite,
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
  const guideUpdate = vi.fn((_patch: Record<string, unknown>) => ({ eq: guideUpdateEq }));
  const guideUpsert = vi.fn().mockResolvedValue({ error: null });
  const guideInsert = vi.fn().mockResolvedValue({ error: null });
  const guideMaybeSingle = vi.fn().mockResolvedValue({
    data: { user_id: TARGET_ID, verification_status: "submitted" },
    error: null,
  });
  const guideSelectEq = vi.fn(() => ({ maybeSingle: guideMaybeSingle }));
  const guideSelect = vi.fn(() => ({ eq: guideSelectEq }));
  const from = vi.fn((table: string) => {
    if (table === "guide_profiles") {
      return { update: guideUpdate, upsert: guideUpsert, insert: guideInsert, select: guideSelect };
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
    guideInsert,
    guideMaybeSingle,
    from,
  };
}

/** A guide-eligible target: has a phone (the role gate requires one). */
function guideEligibleTarget(over: Record<string, unknown> = {}) {
  return {
    id: TARGET_ID,
    email: "demo@example.com",
    fullName: "Иван Петров",
    phone: "+7 999 123-45-67",
    role: "traveler",
    accountStatus: "active",
    ...over,
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

  it("bans the GoTrue session when suspending so the status change is not cosmetic (#35)", async () => {
    const { client, updateUserById } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "traveler@example.com",
      role: "traveler",
      accountStatus: "active",
    });
    mocks.countOtherActiveAdmins.mockResolvedValue(3);
    mocks.createSupabaseServerClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await setAccountStatusAction(
      null,
      form({ targetUserId: TARGET_ID, status: "suspended", reason: "abuse" }),
    );

    expect(result.ok).toBe(true);
    expect(updateUserById).toHaveBeenCalledWith(TARGET_ID, { ban_duration: "876000h" });
  });

  it("clears the GoTrue ban when reactivating (#35)", async () => {
    const { client, updateUserById } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue({
      id: TARGET_ID,
      email: "traveler@example.com",
      role: "traveler",
      accountStatus: "suspended",
    });
    mocks.countOtherActiveAdmins.mockResolvedValue(3);
    mocks.createSupabaseServerClient.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await setAccountStatusAction(
      null,
      form({ targetUserId: TARGET_ID, status: "active", reason: "restored" }),
    );

    expect(result.ok).toBe(true);
    expect(updateUserById).toHaveBeenCalledWith(TARGET_ID, { ban_duration: "none" });
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
    const { client, guideInsert, guideMaybeSingle } = makeAdminClient();
    // A traveler being promoted has no guide_profiles row yet.
    guideMaybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue(guideEligibleTarget());
    mocks.countOtherActiveAdmins.mockResolvedValue(2);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "guide", reason: "role test" }),
    );

    expect(result.ok).toBe(true);
    // insert, not upsert: an upsert is what clobbered existing guides (item 13).
    expect(guideInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: TARGET_ID,
        verification_status: "draft",
        is_available: false,
      }),
    );
  });

  it("removes public availability when demoting a guide", async () => {
    const { client, guideUpdate, guideUpdateEq } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue(
      guideEligibleTarget({ role: "guide", email: "guide@example.com" }),
    );
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
    const { client, guideInsert, guideMaybeSingle, updateUserById, profileUpdate } =
      makeAdminClient();
    guideMaybeSingle.mockResolvedValue({ data: null, error: null });
    guideInsert.mockResolvedValueOnce({ error: { message: "boom" } });
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue(guideEligibleTarget());
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

// Items 13 + 18 (msgs 544–593): flipping a role admin↔guide overwrote the guide's
// public identity (display_name → email local-part), reset verification to draft and
// hid them from /guides. Admins could not see it: RLS shows them profiles.full_name
// while anonymous visitors read the clobbered guide_profiles.display_name.
describe("buildGuideRoleFlipWrite (role-flip identity guard)", () => {
  it("never rewrites identity for an existing guide profile", () => {
    const write = buildGuideRoleFlipWrite(
      { user_id: TARGET_ID, verification_status: "approved" },
      { targetId: TARGET_ID, targetFullName: "Иван Петров" },
    );

    expect(write.kind).not.toBe("insert");
    expect(JSON.stringify(write)).not.toContain("display_name");
    expect(JSON.stringify(write)).not.toContain("verification_status");
  });

  it("restores public visibility for an approved guide (undoes the demote hide)", () => {
    expect(
      buildGuideRoleFlipWrite(
        { user_id: TARGET_ID, verification_status: "approved" },
        { targetId: TARGET_ID, targetFullName: "Иван Петров" },
      ),
    ).toEqual({ kind: "restore-visibility" });
  });

  it("leaves a not-yet-approved guide untouched (never silently publishes)", () => {
    expect(
      buildGuideRoleFlipWrite(
        { user_id: TARGET_ID, verification_status: "submitted" },
        { targetId: TARGET_ID, targetFullName: "Иван Петров" },
      ),
    ).toEqual({ kind: "noop" });
  });

  it("creates a draft, hidden profile when the user has none", () => {
    expect(
      buildGuideRoleFlipWrite(null, { targetId: TARGET_ID, targetFullName: "Иван Петров" }),
    ).toEqual({
      kind: "insert",
      row: {
        user_id: TARGET_ID,
        display_name: "Иван Петров",
        verification_status: "draft",
        is_available: false,
      },
    });
  });

  it("never falls back to the email local-part for a new profile (item 13 privacy)", () => {
    const write = buildGuideRoleFlipWrite(null, { targetId: TARGET_ID, targetFullName: null });

    // No full name → the generic role word, never anything derived from the email.
    expect(write).toEqual({
      kind: "insert",
      row: {
        user_id: TARGET_ID,
        display_name: COPY.guide,
        verification_status: "draft",
        is_available: false,
      },
    });
  });
});

describe("setUserRoleAction — identity preservation + phone gate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not touch an existing guide profile's identity when re-promoting", async () => {
    const { client, guideUpsert, guideInsert, guideUpdate } = makeAdminClient();
    // Re-promoting a previously approved guide (the msgs 570–574 round trip).
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue(
      guideEligibleTarget({ role: "admin", email: "guide@example.com" }),
    );
    mocks.countOtherActiveAdmins.mockResolvedValue(2);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "guide", reason: "role test" }),
    );

    expect(result.ok).toBe(true);
    // The clobber: an upsert/insert carrying display_name + verification_status.
    expect(guideUpsert).not.toHaveBeenCalled();
    expect(guideInsert).not.toHaveBeenCalled();
    // Only the visibility flag may move, and only for an approved guide.
    for (const [patch] of guideUpdate.mock.calls) {
      expect(Object.keys(patch)).toEqual(["is_available"]);
    }
  });

  it("restores availability when re-promoting an approved guide", async () => {
    const { client, guideUpdate, guideMaybeSingle } = makeAdminClient();
    guideMaybeSingle.mockResolvedValue({
      data: { user_id: TARGET_ID, verification_status: "approved" },
      error: null,
    });
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue(guideEligibleTarget({ role: "admin" }));
    mocks.countOtherActiveAdmins.mockResolvedValue(2);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "guide", reason: "role test" }),
    );

    expect(result.ok).toBe(true);
    expect(guideUpdate).toHaveBeenCalledWith({ is_available: true });
  });

  it("rejects promoting a phoneless user to guide (item 18 — the live bypass)", async () => {
    const { client, updateUserById, guideInsert } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue(guideEligibleTarget({ phone: null }));
    mocks.countOtherActiveAdmins.mockResolvedValue(2);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "guide", reason: "role test" }),
    );

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toContain("телефон");
    // Rejected before any write — no half-applied role.
    expect(updateUserById).not.toHaveBeenCalled();
    expect(guideInsert).not.toHaveBeenCalled();
  });

  it("rejects a phone that has no digits", async () => {
    const { client, updateUserById } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue(guideEligibleTarget({ phone: "---" }));
    mocks.countOtherActiveAdmins.mockResolvedValue(2);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "guide", reason: "role test" }),
    );

    expect(result.ok).toBe(false);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it("does not require a phone to demote a guide", async () => {
    const { client } = makeAdminClient();
    mocks.requireAdminSession.mockResolvedValue({ adminId: ADMIN_ID, adminClient: client });
    mocks.getTargetForGuards.mockResolvedValue(
      guideEligibleTarget({ role: "guide", phone: null }),
    );
    mocks.countOtherActiveAdmins.mockResolvedValue(2);

    const result = await setUserRoleAction(
      null,
      form({ targetUserId: TARGET_ID, role: "traveler", reason: "role test" }),
    );

    expect(result.ok).toBe(true);
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
