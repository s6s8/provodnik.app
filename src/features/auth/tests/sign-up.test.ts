import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createUserMock,
  updateUserByIdMock,
  deleteUserMock,
  _getUserByIdMock,
  upsertMock,
  phoneLookupMaybeSingleMock,
  fromMock,
  signInWithPasswordMock,
  createSupabaseAdminClient,
  createSupabaseServerClient,
} = vi.hoisted(() => {
  const createUserMock = vi.fn();
  const updateUserByIdMock = vi.fn();
  const deleteUserMock = vi.fn();
  const _getUserByIdMock = vi.fn().mockResolvedValue({ data: { user: { created_at: new Date().toISOString() } } });
  const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
  // Phone-uniqueness pre-check: from("profiles").select("id").eq(...).maybeSingle()
  const phoneLookupMaybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
  const selectMock = vi.fn(() => ({
    eq: vi.fn(() => ({ maybeSingle: phoneLookupMaybeSingleMock })),
  }));
  const fromMock = vi.fn(() => ({ upsert: upsertMock, select: selectMock }));
  const signInWithPasswordMock = vi.fn();

  const adminClient = {
    auth: {
      admin: {
        createUser: createUserMock,
        updateUserById: updateUserByIdMock,
        deleteUser: deleteUserMock,
        getUserById: _getUserByIdMock,
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
    _getUserByIdMock,
    upsertMock,
    phoneLookupMaybeSingleMock,
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("signUpAction — public signup roles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertMock.mockResolvedValue({ data: null, error: null });
    _getUserByIdMock.mockResolvedValue({
      data: { user: { created_at: new Date().toISOString() } },
      error: null,
    });
    deleteUserMock.mockResolvedValue({ data: null, error: null });
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

    expect(result).toEqual({ ok: true, dashboardPath: "/trips" });
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

  it("rejects signup when the phone is already attached to another account", async () => {
    mockSuccessfulRegistration();
    phoneLookupMaybeSingleMock.mockResolvedValueOnce({
      data: { id: "existing-owner" },
      error: null,
    });

    const result = await signUpAction({ ...baseInput, role: "traveler" });

    expect(result).toEqual({ ok: false, error: "phone_taken" });
    // The duplicate is caught before any auth user is created.
    expect(createUserMock).not.toHaveBeenCalled();
  });

  it("skips the phone uniqueness lookup when no phone is provided", async () => {
    mockSuccessfulRegistration();

    const result = await signUpAction({
      ...baseInput,
      phone: undefined,
      role: "traveler",
    });

    expect(result).toEqual({ ok: true, dashboardPath: "/trips" });
    expect(phoneLookupMaybeSingleMock).not.toHaveBeenCalled();
  });
});

describe("signUpAction — failure rollback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertMock.mockResolvedValue({ data: null, error: null });
    _getUserByIdMock.mockResolvedValue({
      data: { user: { created_at: new Date().toISOString() } },
      error: null,
    });
    deleteUserMock.mockResolvedValue({ data: null, error: null });
  });

  it("returns a controlled error when auth creation succeeds without a user id", async () => {
    createUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const result = await signUpAction({ ...baseInput, role: "traveler" });

    expect(result).toEqual({ ok: false, error: "internal" });
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("rolls the auth user back when the profiles upsert fails", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-9" } }, error: null });
    upsertMock.mockResolvedValue({ data: null, error: { message: "upsert failed" } });

    const result = await signUpAction({ ...baseInput, role: "traveler" });

    expect(result).toEqual({ ok: false, error: "profile_failed" });
    expect(deleteUserMock).toHaveBeenCalledWith("user-9");
  });

  it("reports rollback lookup failures while preserving the original profile error", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-9" } }, error: null });
    upsertMock.mockResolvedValue({ data: null, error: { message: "upsert failed" } });
    _getUserByIdMock.mockResolvedValue({
      data: null,
      error: { message: "lookup failed" },
    });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await signUpAction({ ...baseInput, role: "traveler" });

    expect(result).toEqual({ ok: false, error: "profile_failed" });
    expect(consoleError).toHaveBeenCalledWith(
      "[signUpAction] auth rollback lookup failed:",
      expect.objectContaining({ message: "lookup failed" }),
    );
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("reports rollback delete failures while preserving the original profile error", async () => {
    createUserMock.mockResolvedValue({ data: { user: { id: "user-9" } }, error: null });
    upsertMock.mockResolvedValue({ data: null, error: { message: "upsert failed" } });
    deleteUserMock.mockResolvedValue({ data: null, error: { message: "delete failed" } });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const result = await signUpAction({ ...baseInput, role: "traveler" });

    expect(result).toEqual({ ok: false, error: "profile_failed" });
    expect(consoleError).toHaveBeenCalledWith(
      "[signUpAction] auth rollback delete failed:",
      expect.objectContaining({ message: "delete failed" }),
    );
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
