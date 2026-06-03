import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClientMock,
  markThreadReadMock,
  readAuthContextFromServerMock,
  sendMessageMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  markThreadReadMock: vi.fn(),
  readAuthContextFromServerMock: vi.fn(),
  sendMessageMock: vi.fn(),
}));

vi.mock("@/lib/auth/server-auth", () => ({
  readAuthContextFromServer: readAuthContextFromServerMock,
}));

vi.mock("@/lib/supabase/conversations", () => ({
  markThreadRead: markThreadReadMock,
  sendMessage: sendMessageMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { sendMessageAction } from "./actions";

const threadId = "11111111-1111-4111-8111-111111111111";
const userId = "22222222-2222-4222-8222-222222222222";

function createAuthorizedClient(participant: unknown) {
  const participantMaybeSingle = vi.fn().mockResolvedValue({
    data: participant,
    error: null,
  });
  const participantUserEq = vi.fn(() => ({ maybeSingle: participantMaybeSingle }));
  const participantThreadEq = vi.fn(() => ({ eq: participantUserEq }));
  const participantSelect = vi.fn(() => ({ eq: participantThreadEq }));

  const profileMaybeSingle = vi.fn().mockResolvedValue({
    data: { role: "traveler" },
    error: null,
  });
  const profileEq = vi.fn(() => ({ maybeSingle: profileMaybeSingle }));
  const profileSelect = vi.fn(() => ({ eq: profileEq }));

  const from = vi.fn((table: string) => {
    if (table === "thread_participants") {
      return { select: participantSelect };
    }

    return { select: profileSelect };
  });

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
    participantThreadEq,
    participantUserEq,
  };
}

describe("sendMessageAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readAuthContextFromServerMock.mockResolvedValue({
      isAuthenticated: true,
      role: "traveler",
      userId,
    });
    sendMessageMock.mockResolvedValue({
      id: "message-1",
      thread_id: threadId,
      sender_id: userId,
      sender_role: "traveler",
      body: "Здравствуйте",
      metadata: {},
      created_at: "2026-06-03T06:00:00.000Z",
    });
  });

  it("does not send a message when the user is not a thread participant", async () => {
    const supabase = createAuthorizedClient(null);
    createSupabaseServerClientMock.mockResolvedValue(supabase.client);

    const result = await sendMessageAction(threadId, "Здравствуйте");

    expect(result).toEqual({
      success: false,
      error: "Диалог не найден.",
    });
    expect(supabase.from).toHaveBeenCalledWith("thread_participants");
    expect(supabase.participantThreadEq).toHaveBeenCalledWith("thread_id", threadId);
    expect(supabase.participantUserEq).toHaveBeenCalledWith("user_id", userId);
    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});
