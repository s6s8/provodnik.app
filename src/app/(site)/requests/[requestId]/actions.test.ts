import { describe, expect, it, vi } from "vitest";

const {
  createNotification,
  createSupabaseServerClient,
  joinRequest,
  redirect,
  revalidatePath,
} = vi.hoisted(() => ({
  createNotification: vi.fn(),
  createSupabaseServerClient: vi.fn(),
  joinRequest: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

vi.mock("@/lib/notifications/create-notification", () => ({
  createNotification,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/request-members", () => ({
  joinRequest,
}));

import { joinRequestAction } from "./actions";

describe("joinRequestAction", () => {
  it("redirects unauthenticated users instead of silently ignoring the join", async () => {
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    });

    await expect(joinRequestAction("request-1")).rejects.toThrow(
      "NEXT_REDIRECT:/auth?next=/requests/request-1",
    );
    expect(redirect).toHaveBeenCalledWith("/auth?next=/requests/request-1");
    expect(joinRequest).not.toHaveBeenCalled();
  });

  it("returns and logs join failures instead of swallowing them", async () => {
    const error = new Error("capacity exceeded");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    joinRequest.mockRejectedValue(error);
    createNotification.mockResolvedValue(undefined);
    createSupabaseServerClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "traveler-1" } },
          error: null,
        }),
      },
      from: vi.fn(),
    });

    await expect(joinRequestAction("request-1")).resolves.toEqual({
      error: "capacity exceeded",
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[joinRequestAction] failed to join request:",
      error,
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
