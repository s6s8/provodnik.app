import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ConversationThreadRow,
  MessageRow,
  ThreadParticipantRow,
  Uuid,
} from "@/lib/supabase/types";

export type ConversationThreadRecord = {
  id: string;
  subjectType: ConversationThreadRow["subject_type"];
  requestId: string | null;
  offerId: string | null;
  bookingId: string | null;
  disputeId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ThreadParticipantRecord = {
  threadId: string;
  userId: string;
  joinedAt: string;
  lastReadAt: string | null;
};

export type MessageRecord = {
  id: string;
  threadId: string;
  senderId: string | null;
  senderRole: MessageRow["sender_role"];
  body: string;
  metadata: unknown;
  createdAt: string;
};

function mapThreadRow(row: ConversationThreadRow): ConversationThreadRecord {
  return {
    id: row.id,
    subjectType: row.subject_type,
    requestId: row.request_id,
    offerId: row.offer_id,
    bookingId: row.booking_id,
    disputeId: row.dispute_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapParticipantRow(
  row: ThreadParticipantRow,
): ThreadParticipantRecord {
  return {
    threadId: row.thread_id,
    userId: row.user_id,
    joinedAt: row.joined_at,
    lastReadAt: row.last_read_at,
  };
}

function mapMessageRow(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderRole: row.sender_role,
    body: row.body,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export async function listThreadsForUser(
  userId: Uuid,
): Promise<ConversationThreadRecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data: participants, error } = await supabase
    .from("thread_participants")
    .select("thread_id")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const threadIds = (participants ?? [])
    .map((row) => row.thread_id as Uuid)
    .filter(Boolean);

  if (!threadIds.length) return [];

  const { data: threads, error: threadsError } = await supabase
    .from("conversation_threads")
    .select(
      "id, subject_type, request_id, offer_id, booking_id, dispute_id, created_by, created_at, updated_at",
    )
    .in("id", threadIds)
    .order("updated_at", { ascending: false });

  if (threadsError) {
    throw threadsError;
  }

  return (threads as ConversationThreadRow[]).map(mapThreadRow);
}

export async function listParticipantsForThread(
  threadId: Uuid,
): Promise<ThreadParticipantRecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("thread_participants")
    .select("thread_id, user_id, joined_at, last_read_at")
    .eq("thread_id", threadId)
    .order("joined_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as ThreadParticipantRow[]).map(mapParticipantRow);
}

export async function listMessagesForThread(
  threadId: Uuid,
): Promise<MessageRecord[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("messages")
    .select(
      "id, thread_id, sender_id, sender_role, body, metadata, created_at",
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data as MessageRow[]).map(mapMessageRow);
}

