import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { markNotificationReadInSupabase } from "./supabase";

const userId = "22222222-2222-4222-8222-222222222222";
const notificationId = "33333333-3333-4333-8333-333333333333";

function createNotificationUpdateClient() {
  const userEq = vi.fn().mockResolvedValue({ error: null });
  const idEq = vi.fn(() => ({ eq: userEq }));
  const update = vi.fn(() => ({ eq: idEq }));
  const from = vi.fn(() => ({ update }));

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from,
    },
    from,
    update,
    idEq,
    userEq,
  };
}

describe("markNotificationReadInSupabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes the update to the authenticated user's notification", async () => {
    const supabase = createNotificationUpdateClient();
    createSupabaseServerClient.mockResolvedValue(supabase.client);

    await markNotificationReadInSupabase(notificationId);

    expect(supabase.from).toHaveBeenCalledWith("notifications");
    expect(supabase.idEq).toHaveBeenCalledWith("id", notificationId);
    expect(supabase.userEq).toHaveBeenCalledWith("user_id", userId);
  });
});
