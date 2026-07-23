import { beforeEach, describe, expect, it, vi } from "vitest";

import { AVATAR_MESSAGES } from "./avatar-errors";

const readAuthContextFromServer = vi.fn();
vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: () => readAuthContextFromServer(),
}));

const getPresignedUploadUrl = vi.fn();
const getPublicUrl = vi.fn();
vi.mock("@/lib/storage/upload", () => ({
  assertMimeTypeAllowed: vi.fn(),
  assertByteSizeAllowed: vi.fn(),
  getPresignedUploadUrl: (...args: unknown[]) => getPresignedUploadUrl(...args),
  getPublicUrl: (...args: unknown[]) => getPublicUrl(...args),
}));

let updateResult: { data: unknown; error: unknown };
const createSupabaseServerClient = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: () => createSupabaseServerClient(),
}));

function fakeClient() {
  return {
    from: () => ({
      update: () => ({
        eq: () => ({
          select: async () => updateResult,
        }),
      }),
    }),
  };
}

describe("avatar upload actions", () => {
  beforeEach(() => {
    readAuthContextFromServer.mockResolvedValue({
      isAuthenticated: true,
      userId: "user-1",
      role: "traveler",
    });
    createSupabaseServerClient.mockResolvedValue(fakeClient());
    getPresignedUploadUrl.mockResolvedValue({
      signedUrl: "https://cdn.test/upload",
      path: "user-1/avatar.png",
      token: "token",
    });
    getPublicUrl.mockReturnValue("https://cdn.test/a.png");
  });

  it("returns a presigned upload URL without sending file bytes through the server action", async () => {
    const { requestAvatarUploadUrlAction } = await import("./avatar-action");

    const result = await requestAvatarUploadUrlAction({
      mimeType: "image/png",
      byteSize: 1024,
    });

    expect(result).toEqual({
      ok: true,
      signedUrl: "https://cdn.test/upload",
      objectPath: "user-1/avatar.png",
      token: "token",
    });
    expect(getPresignedUploadUrl).toHaveBeenCalledWith(
      "traveler-avatars",
      "avatar.png",
      "image/png",
      "user-1",
    );
  });

  it("returns { ok: false } when the profiles update affects 0 rows", async () => {
    updateResult = { data: [], error: null };
    const { confirmAvatarUploadAction } = await import("./avatar-action");

    const result = await confirmAvatarUploadAction({
      objectPath: "user-1/avatar.png",
      mimeType: "image/png",
      byteSize: 1024,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe(AVATAR_MESSAGES.GENERIC_ERROR);
  });

  it("returns { ok: true } when the update affects the owner row", async () => {
    updateResult = { data: [{ id: "user-1" }], error: null };
    const { confirmAvatarUploadAction } = await import("./avatar-action");

    const result = await confirmAvatarUploadAction({
      objectPath: "user-1/avatar.png",
      mimeType: "image/png",
      byteSize: 1024,
    });

    expect(result.ok).toBe(true);
    expect(getPublicUrl).toHaveBeenCalledWith("traveler-avatars", "user-1/avatar.png");
  });

  it("rejects object paths outside the authenticated user folder", async () => {
    const { confirmAvatarUploadAction } = await import("./avatar-action");

    const result = await confirmAvatarUploadAction({
      objectPath: "other-user/avatar.png",
      mimeType: "image/png",
      byteSize: 1024,
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe(AVATAR_MESSAGES.GENERIC_ERROR);
  });
});
