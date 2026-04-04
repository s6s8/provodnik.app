/**
 * conversations.ts — Conversation service layer (server-only)
 *
 * All functions use createSupabaseServerClient and are intended for Server
 * Components and Server Actions only. Never import this file from client
 * components.
 *
 * userId values must come from the authenticated server context — never from
 * untrusted client input.
 */

import { z } from "zod";

import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ConversationThreadRow,
  MessageRow,
  MessageSenderRole,
  ThreadParticipantRow,
  ThreadSubject,
  Uuid,
} from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ConversationThreadInsert =
  Database["public"]["Tables"]["conversation_threads"]["Insert"];
type ThreadParticipantInsert =
  Database["public"]["Tables"]["thread_participants"]["Insert"];

type SenderProfile = Pick<ProfileRow, "full_name" | "avatar_url">;

export type ConversationThread = ConversationThreadRow;
export type ConversationThreadWithParticipants = ConversationThreadRow & {
  participants: ThreadParticipantRow[];
};
export type Message = MessageRow;
export type MessageWithSender = MessageRow & {
  sender_profile: SenderProfile | null;
};
export type UserThreadSummary = ConversationThreadRow & {
  participants: ThreadParticipantRow[];
  other_participant_names: string[];
  last_message_preview: string | null;
  last_message_created_at: string | null;
  unread: boolean;
};

const THREAD_SELECT =
  "id, subject_type, request_id, offer_id, booking_id, dispute_id, created_by, created_at, updated_at";
const THREAD_PARTICIPANT_SELECT = "thread_id, user_id, joined_at, last_read_at";
const MESSAGE_SELECT =
  "id, thread_id, sender_id, sender_role, body, metadata, created_at";
const MESSAGE_WITH_SENDER_SELECT = `${MESSAGE_SELECT}, sender_profile:profiles!sender_id(full_name, avatar_url)`;

const uuidSchema = z.string().uuid("Некорректный UUID.");
const threadSubjectSchema = z.enum(["request", "offer", "booking", "dispute"], {
  message: "Некорректный тип темы.",
});
const senderRoleSchema = z.enum(["traveler", "guide", "admin", "system"], {
  message: "Некорректная роль отправителя.",
});

const getOrCreateThreadInputSchema = z.object({
  subjectType: threadSubjectSchema,
  subjectId: uuidSchema,
  createdByUserId: uuidSchema,
  participantIds: z
    .array(uuidSchema)
    .min(1, "Укажите хотя бы одного участника переписки."),
});

const sendMessageInputSchema = z.object({
  threadId: uuidSchema,
  senderId: uuidSchema,
  senderRole: senderRoleSchema,
  body: z
    .string()
    .trim()
    .min(1, "Сообщение не должно быть пустым.")
    .max(5_000, "Сообщение не должно превышать 5000 символов."),
});

const getThreadMessagesInputSchema = z.object({
  threadId: uuidSchema,
  cursor: z
    .string()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(new Date(value).getTime()),
      "Некорректный курсор пагинации.",
    ),
  limit: z
    .number()
    .int("Лимит должен быть целым числом.")
    .min(1, "Лимит должен быть не меньше 1.")
    .max(100, "Лимит не должен превышать 100.")
    .default(50),
});

const userIdInputSchema = z.object({
  userId: uuidSchema,
});

const markThreadReadInputSchema = z.object({
  threadId: uuidSchema,
  userId: uuidSchema,
});

const SUBJECT_COLUMN_BY_TYPE: Record<
  ThreadSubject,
  keyof Pick<
    ConversationThreadRow,
    "request_id" | "offer_id" | "booking_id" | "dispute_id"
  >
> = {
  request: "request_id",
  offer: "offer_id",
  booking: "booking_id",
  dispute: "dispute_id",
};

function getThreadInsertPayload(
  subjectType: ThreadSubject,
  subjectId: Uuid,
  createdByUserId: Uuid,
): ConversationThreadInsert {
  return {
    subject_type: subjectType,
    request_id: subjectType === "request" ? subjectId : null,
    offer_id: subjectType === "offer" ? subjectId : null,
    booking_id: subjectType === "booking" ? subjectId : null,
    dispute_id: subjectType === "dispute" ? subjectId : null,
    created_by: createdByUserId,
  };
}

function normalizeRelation<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }

  return (value as T | null) ?? null;
}

function dedupeParticipantIds(createdByUserId: Uuid, participantIds: Uuid[]): Uuid[] {
  return [...new Set([createdByUserId, ...participantIds])];
}

function truncatePreview(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length <= 100) return trimmed;
  return `${trimmed.slice(0, 100).trimEnd()}…`;
}

function isUnread(
  userId: Uuid,
  lastReadAt: string | null,
  latestMessage: Pick<MessageRow, "created_at" | "sender_id"> | null,
): boolean {
  if (!latestMessage) return false;
  if (latestMessage.sender_id === userId) return false;
  if (!lastReadAt) return true;
  return latestMessage.created_at > lastReadAt;
}

async function getThreadParticipants(
  threadId: Uuid,
): Promise<ThreadParticipantRow[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("thread_participants")
    .select(THREAD_PARTICIPANT_SELECT)
    .eq("thread_id", threadId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return (data as ThreadParticipantRow[]) ?? [];
}

async function getThreadBySubject(
  subjectType: ThreadSubject,
  subjectId: Uuid,
): Promise<ConversationThreadRow | null> {
  const supabase = await createSupabaseServerClient();
  const subjectColumn = SUBJECT_COLUMN_BY_TYPE[subjectType];

  const { data, error } = await supabase
    .from("conversation_threads")
    .select(THREAD_SELECT)
    .eq(subjectColumn, subjectId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return (data as ConversationThreadRow | null) ?? null;
}

async function hydrateThread(
  thread: ConversationThreadRow,
): Promise<ConversationThreadWithParticipants> {
  const participants = await getThreadParticipants(thread.id);

  return {
    ...thread,
    participants,
  };
}

async function listLatestMessagesByThread(
  threadIds: Uuid[],
): Promise<Map<Uuid, Pick<MessageRow, "thread_id" | "body" | "created_at" | "sender_id">>> {
  if (!threadIds.length) return new Map();

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("messages")
    .select("thread_id, body, created_at, sender_id")
    .in("thread_id", threadIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const latestByThread = new Map<
    Uuid,
    Pick<MessageRow, "thread_id" | "body" | "created_at" | "sender_id">
  >();

  for (const row of (data as Array<
    Pick<MessageRow, "thread_id" | "body" | "created_at" | "sender_id">
  >) ?? []) {
    if (!latestByThread.has(row.thread_id)) {
      latestByThread.set(row.thread_id, row);
    }
  }

  return latestByThread;
}

async function listParticipantsWithProfiles(
  threadIds: Uuid[],
): Promise<
  Map<
    Uuid,
    Array<ThreadParticipantRow & { profile: Pick<ProfileRow, "id" | "full_name"> | null }>
  >
> {
  if (!threadIds.length) return new Map();

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("thread_participants")
    .select(
      `${THREAD_PARTICIPANT_SELECT}, profile:profiles!user_id(id, full_name)`,
    )
    .in("thread_id", threadIds)
    .order("joined_at", { ascending: true });

  if (error) throw error;

  const grouped = new Map<
    Uuid,
    Array<ThreadParticipantRow & { profile: Pick<ProfileRow, "id" | "full_name"> | null }>
  >();

  for (const rawRow of (data as Array<Record<string, unknown>>) ?? []) {
    const row: ThreadParticipantRow & {
      profile: Pick<ProfileRow, "id" | "full_name"> | null;
    } = {
      thread_id: rawRow.thread_id as Uuid,
      user_id: rawRow.user_id as Uuid,
      joined_at: rawRow.joined_at as string,
      last_read_at: (rawRow.last_read_at as string | null) ?? null,
      profile: normalizeRelation<Pick<ProfileRow, "id" | "full_name">>(
        rawRow.profile,
      ),
    };

    const items = grouped.get(row.thread_id) ?? [];
    items.push(row);
    grouped.set(row.thread_id, items);
  }

  return grouped;
}

export async function getOrCreateThread(
  subjectType: ThreadSubject,
  subjectId: string,
  createdByUserId: string,
  participantIds: string[],
): Promise<ConversationThreadWithParticipants> {
  const input = getOrCreateThreadInputSchema.parse({
    subjectType,
    subjectId,
    createdByUserId,
    participantIds,
  });

  const existingThread = await getThreadBySubject(input.subjectType, input.subjectId);
  if (existingThread) {
    return hydrateThread(existingThread);
  }

  const supabase = await createSupabaseServerClient();
  const normalizedParticipantIds = dedupeParticipantIds(
    input.createdByUserId,
    input.participantIds,
  );

  const { data, error } = await supabase
    .from("conversation_threads")
    .insert(
      getThreadInsertPayload(
        input.subjectType,
        input.subjectId,
        input.createdByUserId,
      ),
    )
    .select(THREAD_SELECT)
    .single();

  if (error) {
    if (error.code === "23505") {
      const raceWinner = await getThreadBySubject(input.subjectType, input.subjectId);
      if (!raceWinner) {
        throw new Error("Не удалось получить существующий диалог после конфликта создания.");
      }

      return hydrateThread(raceWinner);
    }

    throw error;
  }

  const thread = data as ConversationThreadRow;

  const participantRows: ThreadParticipantInsert[] = normalizedParticipantIds.map(
    (userId) => ({
      thread_id: thread.id,
      user_id: userId,
    }),
  );

  const { error: participantsError } = await supabase
    .from("thread_participants")
    .upsert(participantRows, { onConflict: "thread_id,user_id" });

  if (participantsError) throw participantsError;

  return hydrateThread(thread);
}

export async function sendMessage(
  threadId: string,
  senderId: string,
  senderRole: MessageSenderRole,
  body: string,
): Promise<Message> {
  const input = sendMessageInputSchema.parse({
    threadId,
    senderId,
    senderRole,
    body,
  });

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      thread_id: input.threadId,
      sender_id: input.senderId,
      sender_role: input.senderRole,
      body: input.body,
    })
    .select(MESSAGE_SELECT)
    .single();

  if (error) throw error;
  return data as MessageRow;
}

export async function getThreadMessages(
  threadId: string,
  options?: { cursor?: string; limit?: number },
): Promise<MessageWithSender[]> {
  const input = getThreadMessagesInputSchema.parse({
    threadId,
    cursor: options?.cursor,
    limit: options?.limit ?? 50,
  });

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("messages")
    .select(MESSAGE_WITH_SENDER_SELECT)
    .eq("thread_id", input.threadId)
    .order("created_at", { ascending: true })
    .limit(input.limit);

  if (input.cursor) {
    query = query.gt("created_at", input.cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  return ((data as Array<Record<string, unknown>>) ?? []).map((row) => ({
    id: row.id as Uuid,
    thread_id: row.thread_id as Uuid,
    sender_id: (row.sender_id as Uuid | null) ?? null,
    sender_role: row.sender_role as MessageSenderRole,
    body: row.body as string,
    metadata: row.metadata ?? {},
    created_at: row.created_at as string,
    sender_profile: normalizeRelation<SenderProfile>(row.sender_profile),
  }));
}

export async function getUserThreads(userId: string): Promise<UserThreadSummary[]> {
  const input = userIdInputSchema.parse({ userId });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("thread_participants")
    .select(
      `${THREAD_PARTICIPANT_SELECT}, thread:conversation_threads!thread_id(${THREAD_SELECT})`,
    )
    .eq("user_id", input.userId)
    .order("joined_at", { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  const participantRows = (data as Array<Record<string, unknown>>).map((row) => ({
    thread_id: row.thread_id as Uuid,
    user_id: row.user_id as Uuid,
    joined_at: row.joined_at as string,
    last_read_at: (row.last_read_at as string | null) ?? null,
    thread: normalizeRelation<ConversationThreadRow>(row.thread),
  }));

  const threadIds = participantRows
    .map((row) => row.thread?.id)
    .filter((value): value is Uuid => Boolean(value));

  const [latestMessagesByThread, participantsByThread] = await Promise.all([
    listLatestMessagesByThread(threadIds),
    listParticipantsWithProfiles(threadIds),
  ]);

  const summaries = participantRows
    .map((row) => {
      if (!row.thread) return null;

      const participants = participantsByThread.get(row.thread.id) ?? [];
      const latestMessage = latestMessagesByThread.get(row.thread.id) ?? null;

      const otherParticipantNames = participants
        .filter((participant) => participant.user_id !== input.userId)
        .map((participant) => participant.profile?.full_name?.trim() || "Участник");

      return {
        ...row.thread,
        participants: participants.map(({ profile: _profile, ...participant }) => participant),
        other_participant_names: [...new Set(otherParticipantNames)],
        last_message_preview: latestMessage ? truncatePreview(latestMessage.body) : null,
        last_message_created_at: latestMessage?.created_at ?? null,
        unread: isUnread(input.userId, row.last_read_at, latestMessage),
      } satisfies UserThreadSummary;
    })
    .filter((value): value is UserThreadSummary => value !== null);

  return summaries.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function markThreadRead(
  threadId: string,
  userId: string,
): Promise<void> {
  const input = markThreadReadInputSchema.parse({ threadId, userId });
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("thread_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("thread_id", input.threadId)
    .eq("user_id", input.userId);

  if (error) throw error;
}

export async function getUnreadCount(userId: string): Promise<number> {
  const input = userIdInputSchema.parse({ userId });
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("thread_participants")
    .select(THREAD_PARTICIPANT_SELECT)
    .eq("user_id", input.userId);

  if (error) throw error;
  if (!data?.length) return 0;

  const participantRows = (data as ThreadParticipantRow[]) ?? [];
  const latestMessagesByThread = await listLatestMessagesByThread(
    participantRows.map((row) => row.thread_id),
  );

  return participantRows.reduce((total, row) => {
    const latestMessage = latestMessagesByThread.get(row.thread_id) ?? null;
    return total + (isUnread(input.userId, row.last_read_at, latestMessage) ? 1 : 0);
  }, 0);
}
