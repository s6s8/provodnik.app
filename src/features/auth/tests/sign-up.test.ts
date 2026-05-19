import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createUserMock,
  updateUserByIdMock,
  deleteUserMock,
  upsertMock,
  fromMock,
  signInWithPasswordMock,
  createSupabaseAdminClient,
  createSupabaseServerClient,
} = vi.hoisted(() => {
  const createUserMock = vi.fn();
  const updateUserByIdMock = vi.fn();
  const deleteUserMock = vi.fn();
  const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
  const fromMock = vi.fn(() => ({ upsert: upsertMock }));
  const signInWithPasswordMock = vi.fn();

  const adminClient = {
    auth: {
      admin: {
        createUser: createUserMock,
        updateUserById: updateUserByIdMock,
        deleteUser: deleteUserMock,
      },
    },
    from: fromMock,
  };

  const serverClient = {
    auth: { signInWithPassword: signInWithPasswordMock },
  };

  return {
    createUserMock,
    updateUserByIdMock,
    deleteUserMock,
    upsertMock,
    fromMock,
    signInWithPasswordMock,
    createSupabaseAdminClient: vi.fn(() => adminClient),
    createSupabaseServerClient: vi.fn(async () => serverClient),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { signUpAction } from "@/features/auth/actions/signUpAction";

const baseInput = {
  email: "user@example.com",
  password: "super-secret",
  fullName: "Анна Смирнова",
  phone: "+7 900 123-45-67",
} as const;

function assertNoSupabaseSideEffects() {
  expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  expect(createSupabaseServerClient).not.toHaveBeenCalled();
  expect(createUserMock).not.toHaveBeenCalled();
  expect(updateUserByIdMock).not.toHaveBeenCalled();
  expect(fromMock).not.toHaveBeenCalled();
  expect(upsertMock).not.toHaveBeenCalled();
  expect(signInWithPasswordMock).not.toHaveBeenCalled();
}

function mockSuccessfulRegistration(userId = "user-1") {
  createUserMock.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
  updateUserByIdMock.mockResolvedValue({ data: null, error: null });
  signInWithPasswordMock.mockResolvedValue({ data: {}, error: null });
}

describe("signUpAction — public signup roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertMock.mockResolvedValue({ data: null, error: null });
  });

  it("registers role:guide with guide stamped on user, profile, and app_metadata", async () => {
    mockSuccessfulRegistration();

    const result = await signUpAction({ ...baseInput, role: "guide" });

    expect(result).toEqual({ ok: true, dashboardPath: "/guide" });
    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_metadata: { role: "guide", full_name: baseInput.fullName },
      }),
    );
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "guide" }),
    );
    expect(updateUserByIdMock).toHaveBeenCalledWith("user-1", {
      app_metadata: { role: "guide" },
    });
  });

  it("rejects role:admin with forbidden_role and zero Supabase side-effects", async () => {
    const result = await signUpAction({ ...baseInput, role: "admin" });

    expect(result).toEqual({ ok: false, error: "forbidden_role" });
    assertNoSupabaseSideEffects();
  });

  it("rejects unknown role (e.g. hacker) with forbidden_role", async () => {
    const result = await signUpAction({ ...baseInput, role: "hacker" });

    expect(result).toEqual({ ok: false, error: "forbidden_role" });
    assertNoSupabaseSideEffects();
  });

  it("allows role:traveler — happy path proceeds through admin client", async () => {
    mockSuccessfulRegistration();

    const result = await signUpAction({ ...baseInput, role: "traveler" });

    expect(result).toEqual({ ok: true, dashboardPath: "/traveler/requests" });
    expect(createUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_metadata: { role: "traveler", full_name: baseInput.fullName },
      }),
    );
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "traveler" }),
    );
    expect(updateUserByIdMock).toHaveBeenCalledWith("user-1", {
      app_metadata: { role: "traveler" },
    });
  });
});

describe("signUpAction — failure rollback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertMock.mockResolvedValue({ data: null, error: null });
  });

  it("rolls the auth user back when the profiles upsert fails", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-9" } }, error: null });
    upsertMock.mockResolvedValue({ data: null, error: { message: "upsert failed" } });

    const result = await signUpAction({ ...baseInput, role: "traveler" });

    expect(result).toEqual({ ok: false, error: "profile_failed" });
    expect(deleteUserMock).toHaveBeenCalledWith("user-9");
  });

  it("rolls the auth user back when the app_metadata update fails", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-9" } }, error: null });
    upsertMock.mockResolvedValue({ data: null, error: null });
    updateUserByIdMock.mockResolvedValue({ data: null, error: { message: "role failed" } });

    const result = await signUpAction({ ...baseInput, role: "guide" });

    expect(result).toEqual({ ok: false, error: "role_failed" });
    expect(deleteUserMock).toHaveBeenCalledWith("user-9");
  });

  it("reports signin_after_signup_failed and keeps the valid account", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-9" } }, error: null });
    upsertMock.mockResolvedValue({ data: null, error: null });
    updateUserByIdMock.mockResolvedValue({ data: null, error: null });
    signInWithPasswordMock.mockResolvedValue({ data: {}, error: { message: "no session" } });

    const result = await signUpAction({ ...baseInput, role: "traveler" });

    expect(result).toEqual({ ok: false, error: "signin_after_signup_failed" });
    expect(deleteUserMock).not.toHaveBeenCalled();
  });
});
