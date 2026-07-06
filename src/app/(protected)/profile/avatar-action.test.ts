import { beforeEach, describe, expect, it, vi } from "vitest";

import { AVATAR_MESSAGES } from "./avatar-errors";

const readAuthContextFromServer = vi.fn();
vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: () => readAuthContextFromServer(),
}));

// Row #39: the profiles UPDATE must use .select() so a 0-row update surfaces
// as a failure instead of a silent "success" that never persists the avatar.
let updateResult: { data: unknown; error: unknown };
const createSupabaseServerClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => createSupabaseServerClient(),
}));

function fakeClient() {
  return {
    storage: {
      from: () => ({
        upload: vi.fn(async () => ({ error: null })),
        getPublicUrl: () => ({ data: { publicUrl: "https://cdn.test/a.png" } }),
      }),
    },
    from: () => ({
      update: () => ({
        eq: () => ({
          select: async () => updateResult,
        }),
      }),
    }),
  };
}

function avatarFormData(): FormData {
  const fd = new FormData();
  fd.set("avatar", new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" }));
  return fd;
}

describe("uploadAvatarAction — 0-row update guard (#39)", () => {
  beforeEach(() => {
    readAuthContextFromServer.mockResolvedValue({
      isAuthenticated: true,
      userId: "user-1",
      role: "traveler",
    });
    createSupabaseServerClient.mockResolvedValue(fakeClient());
  });

  it("returns { ok: false } when the profiles update affects 0 rows", async () => {
    updateResult = { data: [], error: null };
    const { uploadAvatarAction } = await import("./avatar-action");

    const result = await uploadAvatarAction(avatarFormData());

    expect(result.ok).toBe(false);
    expect(result.message).toBe(AVATAR_MESSAGES.GENERIC_ERROR);
  });

  it("returns { ok: true } when the update affects the owner row", async () => {
    updateResult = { data: [{ id: "user-1" }], error: null };
    const { uploadAvatarAction } = await import("./avatar-action");

    const result = await uploadAvatarAction(avatarFormData());

    expect(result.ok).toBe(true);
  });
});
