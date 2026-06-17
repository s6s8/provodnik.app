import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClient } = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient,
}));

import { getThreadMessages, getUserThreads } from "./conversations";
import type { UserThreadSummary } from "./conversations";

type QueryResult = {
  data: Array<Record<string, unknown>>;
  error: Error | null;
};

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

function createQuery(result: QueryResult): MockQuery {
  const query = {} as MockQuery;
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.in = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.limit = vi.fn(() => query);
  query.then = vi.fn((resolve: (value: QueryResult) => void) => {
    resolve(result);
  });

  return query;
}

function requireThread(
  summaries: UserThreadSummary[],
  threadId: string,
): UserThreadSummary {
  const thread = summaries.find((summary) => summary.id === threadId);
  if (!thread) throw new Error(`Expected thread ${threadId} in summaries.`);
  return thread;
}

beforeEach(() => {
  createSupabaseServerClient.mockReset();
});

describe("getUserThreads", () => {
  it("maps user thread summaries with latest messages, participants, unread state, and activity ordering", async () => {
    const userId = "00000000-0000-4000-8000-000000000001";
    const guideId = "00000000-0000-4000-8000-000000000002";
    const travelerId = "00000000-0000-4000-8000-000000000003";
    const adminId = "00000000-0000-4000-8000-000000000004";
    const newestThreadId = "10000000-0000-4000-8000-000000000001";
    const middleThreadId = "10000000-0000-4000-8000-000000000002";
    const oldestThreadId = "10000000-0000-4000-8000-000000000003";

    const newestThread = {
      id: newestThreadId,
      subject_type: "request",
      request_id: "20000000-0000-4000-8000-000000000001",
      offer_id: null,
      booking_id: null,
      dispute_id: null,
      created_by: travelerId,
      created_at: "2026-06-10T08:00:00.000Z",
      updated_at: "2026-06-10T12:00:00.000Z",
    };
    const middleThread = {
      id: middleThreadId,
      subject_type: "booking",
      request_id: null,
      offer_id: null,
      booking_id: "30000000-0000-4000-8000-000000000001",
      dispute_id: null,
      created_by: userId,
      created_at: "2026-06-10T07:00:00.000Z",
      updated_at: "2026-06-10T11:00:00.000Z",
    };
    const oldestThread = {
      id: oldestThreadId,
      subject_type: "offer",
      request_id: null,
      offer_id: "40000000-0000-4000-8000-000000000001",
      booking_id: null,
      dispute_id: null,
      created_by: adminId,
      created_at: "2026-06-10T06:00:00.000Z",
      updated_at: "2026-06-10T10:00:00.000Z",
    };

    const participantRows = [
      {
        thread_id: oldestThreadId,
        user_id: userId,
        joined_at: "2026-06-10T06:05:00.000Z",
        last_read_at: null,
        thread: [oldestThread],
      },
      {
        thread_id: newestThreadId,
        user_id: userId,
        joined_at: "2026-06-10T08:05:00.000Z",
        last_read_at: "2026-06-10T12:05:00.000Z",
        thread: newestThread,
      },
      {
        thread_id: middleThreadId,
        user_id: userId,
        joined_at: "2026-06-10T07:05:00.000Z",
        last_read_at: "2026-06-10T11:45:00.000Z",
        thread: middleThread,
      },
    ];
    const latestMessageRows = [
      {
        id: newestThreadId,
        latest_message: {
          thread_id: newestThreadId,
          body: "  Latest unread update  ",
          created_at: "2026-06-10T12:30:00.000Z",
          sender_id: guideId,
        },
      },
      {
        id: middleThreadId,
        latest_message: {
          thread_id: middleThreadId,
          body: "Already read note",
          created_at: "2026-06-10T11:30:00.000Z",
          sender_id: travelerId,
        },
      },
      {
        id: oldestThreadId,
        latest_message: {
          thread_id: oldestThreadId,
          body: "My own message",
          created_at: "2026-06-10T10:30:00.000Z",
          sender_id: userId,
        },
      },
    ];
    const participantProfileRows = [
      {
        thread_id: newestThreadId,
        user_id: userId,
        joined_at: "2026-06-10T08:05:00.000Z",
        last_read_at: "2026-06-10T12:05:00.000Z",
        profile: { id: userId, full_name: "Current User" },
      },
      {
        thread_id: newestThreadId,
        user_id: guideId,
        joined_at: "2026-06-10T08:10:00.000Z",
        last_read_at: null,
        profile: { id: guideId, full_name: null },
      },
      {
        thread_id: middleThreadId,
        user_id: userId,
        joined_at: "2026-06-10T07:05:00.000Z",
        last_read_at: "2026-06-10T11:45:00.000Z",
        profile: { id: userId, full_name: "Current User" },
      },
      {
        thread_id: middleThreadId,
        user_id: travelerId,
        joined_at: "2026-06-10T07:10:00.000Z",
        last_read_at: "2026-06-10T11:40:00.000Z",
        profile: { id: travelerId, full_name: "" },
      },
      {
        thread_id: oldestThreadId,
        user_id: userId,
        joined_at: "2026-06-10T06:05:00.000Z",
        last_read_at: null,
        profile: { id: userId, full_name: "Current User" },
      },
      {
        thread_id: oldestThreadId,
        user_id: adminId,
        joined_at: "2026-06-10T06:10:00.000Z",
        last_read_at: null,
        profile: [{ id: adminId, full_name: "Admin" }],
      },
    ];

    const userParticipantsQuery = createQuery({
      data: participantRows,
      error: null,
    });
    const latestMessagesQuery = createQuery({
      data: latestMessageRows,
      error: null,
    });
    const participantProfilesQuery = createQuery({
      data: participantProfileRows,
      error: null,
    });
    const guideProfilesQuery = createQuery({
      data: [{ user_id: guideId, display_name: "Guide One" }],
      error: null,
    });
    let threadParticipantQueryCount = 0;
    const from = vi.fn((table: string) => {
      if (table === "conversation_threads") return latestMessagesQuery;
      if (table === "guide_profiles") return guideProfilesQuery;
      if (table === "thread_participants") {
        threadParticipantQueryCount += 1;
        return threadParticipantQueryCount === 1
          ? userParticipantsQuery
          : participantProfilesQuery;
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    createSupabaseServerClient.mockResolvedValue({ from });

    const summaries = await getUserThreads(userId);

    expect(summaries.map((summary) => summary.id)).toEqual([
      newestThreadId,
      middleThreadId,
      oldestThreadId,
    ]);

    const newestSummary = requireThread(summaries, newestThreadId);
    expect(newestSummary).toMatchObject({
      ...newestThread,
      participants: [
        {
          thread_id: newestThreadId,
          user_id: userId,
          joined_at: "2026-06-10T08:05:00.000Z",
          last_read_at: "2026-06-10T12:05:00.000Z",
        },
        {
          thread_id: newestThreadId,
          user_id: guideId,
          joined_at: "2026-06-10T08:10:00.000Z",
          last_read_at: null,
        },
      ],
      other_participant_names: ["Guide One"],
      last_message_preview: "Latest unread update",
      last_message_created_at: "2026-06-10T12:30:00.000Z",
      unread: true,
    });
    expect(newestSummary.participants[0]).not.toHaveProperty("profile");

    expect(requireThread(summaries, middleThreadId)).toMatchObject({
      other_participant_names: ["Участник"],
      last_message_preview: "Already read note",
      last_message_created_at: "2026-06-10T11:30:00.000Z",
      unread: false,
    });
    expect(requireThread(summaries, oldestThreadId)).toMatchObject({
      other_participant_names: ["Admin"],
      last_message_preview: "My own message",
      last_message_created_at: "2026-06-10T10:30:00.000Z",
      unread: false,
    });
  });
});

describe("getThreadMessages", () => {
  it("resolves a guide sender name from guide_profiles.display_name when full_name is RLS-null", async () => {
    const threadId = "10000000-0000-4000-8000-000000000099";
    const guideId = "00000000-0000-4000-8000-0000000000aa";
    const travelerId = "00000000-0000-4000-8000-0000000000bb";

    const messageRows = [
      {
        id: "msg-1",
        thread_id: threadId,
        sender_id: travelerId,
        sender_role: "traveler",
        body: "Здравствуйте!",
        metadata: {},
        created_at: "2026-06-10T08:00:00.000Z",
        sender_profile: { full_name: "Анна", avatar_url: null },
      },
      {
        id: "msg-2",
        thread_id: threadId,
        sender_id: guideId,
        sender_role: "guide",
        body: "Готов помочь с маршрутом.",
        metadata: {},
        created_at: "2026-06-10T08:05:00.000Z",
        sender_profile: { full_name: null, avatar_url: null },
      },
    ];

    const messagesQuery = createQuery({ data: messageRows, error: null });
    const guideProfilesQuery = createQuery({
      data: [{ user_id: guideId, display_name: "Гид Дмитрий" }],
      error: null,
    });
    const from = vi.fn((table: string) => {
      if (table === "messages") return messagesQuery;
      if (table === "guide_profiles") return guideProfilesQuery;
      throw new Error(`Unexpected table: ${table}`);
    });
    createSupabaseServerClient.mockResolvedValue({ from });

    const messages = await getThreadMessages(threadId);

    expect(messages.map((message) => message.sender_display_name)).toEqual([
      "Анна",
      "Гид Дмитрий",
    ]);
    expect(from).toHaveBeenCalledWith("guide_profiles");
  });
});
