import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClient,
  getThreadMessages,
  rateLimit,
} = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getThreadMessages: vi.fn(),
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

vi.mock("@/lib/supabase/conversations", () => ({
  getThreadMessages,
}));

vi.mock("@/lib/pii/mask", () => ({
  maskMessageBodies: (messages: unknown[]) => messages,
}));

import { GET } from "./route";

const threadId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

function createParticipantQuery(participant: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: participant, error: null });
  const userEq = vi.fn(() => ({ maybeSingle }));
  const threadEq = vi.fn(() => ({ eq: userEq }));
  const select = vi.fn(() => ({ eq: threadEq }));
  const from = vi.fn(() => ({ select }));

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
    select,
    threadEq,
    userEq,
    maybeSingle,
  };
}

describe("GET /api/messages/threads/[threadId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimit.mockResolvedValue({ success: true, remaining: 29 });
    getThreadMessages.mockResolvedValue([]);
  });

  it("does not load messages for a thread the user does not participate in", async () => {
    const supabase = createParticipantQuery(null);
    createSupabaseServerClient.mockResolvedValue(supabase.client);

    const response = await GET(new Request("https://example.test"), {
      params: Promise.resolve({ threadId }),
    });

    expect(response.status).toBe(404);
    expect(supabase.from).toHaveBeenCalledWith("thread_participants");
    expect(supabase.threadEq).toHaveBeenCalledWith("thread_id", threadId);
    expect(supabase.userEq).toHaveBeenCalledWith("user_id", userId);
    expect(getThreadMessages).not.toHaveBeenCalled();
  });
});
