import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createSupabaseServerClientMock,
  getQaMessagesMock,
  revalidatePathMock,
  sendQaMessageMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  getQaMessagesMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  sendQaMessageMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

vi.mock("@/lib/supabase/qa-threads", () => ({
  getQaMessages: getQaMessagesMock,
  sendQaMessage: sendQaMessageMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import { getQaPanelDataAction, sendQaReplyAction } from "./send-qa-reply";

type QueryFilters = Record<string, unknown>;

function createQuery(dataByTable: Record<string, unknown>) {
  return (table: string) => {
    const filters: QueryFilters = {};
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn((column: string, value: unknown) => {
        filters[column] = value;
        return query;
      }),
      maybeSingle: vi.fn(async () => {
        const value = dataByTable[table];
        if (typeof value === "function") {
          return { data: value(filters), error: null };
        }
        return { data: value ?? null, error: null };
      }),
    };
    return query;
  };
}

function makeSupabase(opts: {
  user?: { id: string } | null;
  dataByTable: Record<string, unknown>;
}) {
  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: opts.user ?? null },
        error: null,
      }),
    },
    from: vi.fn(createQuery(opts.dataByTable)),
  };
  createSupabaseServerClientMock.mockResolvedValue(supabase);
  return supabase;
}

describe("guide QA actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getQaMessagesMock.mockResolvedValue({
      thread_id: "thread-owned",
      messages: [],
      message_count: 0,
      at_limit: false,
    });
    sendQaMessageMock.mockResolvedValue(undefined);
  });

  it("does not load Q&A panel data for offers the guide does not own", async () => {
    makeSupabase({
      user: { id: "guide-owned" },
      dataByTable: {
        guide_offers: null,
        conversation_threads: { id: "thread-other" },
      },
    });

    await expect(getQaPanelDataAction("offer-other")).resolves.toBeNull();
    expect(getQaMessagesMock).not.toHaveBeenCalled();
  });

  it("rejects guide replies when the thread does not belong to the owned offer", async () => {
    makeSupabase({
      user: { id: "guide-owned" },
      dataByTable: {
        guide_offers: { id: "offer-owned" },
        conversation_threads: null,
      },
    });

    await expect(
      sendQaReplyAction("thread-other", "offer-owned", "Answer"),
    ).rejects.toThrow("Нет доступа к этому предложению");
    expect(sendQaMessageMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revalidates guide inbox, request detail, and birjha after sending a reply", async () => {
    makeSupabase({
      user: { id: "guide-owned" },
      dataByTable: {
        guide_offers: { id: "offer-owned", request_id: "request-owned" },
        conversation_threads: { id: "thread-owned" },
      },
    });

    await sendQaReplyAction("thread-owned", "offer-owned", "Answer");

    expect(revalidatePathMock).toHaveBeenCalledWith("/guide/inbox");
    expect(revalidatePathMock).toHaveBeenCalledWith("/guide/inbox/request-owned");
    expect(revalidatePathMock).toHaveBeenCalledWith("/guide");
  });
});
