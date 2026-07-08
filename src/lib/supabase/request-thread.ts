/**
 * request-thread.ts — Open-group shared discussion service layer (server-only).
 *
 * One `subject_type='request'` conversation thread per open request (enforced by
 * ct_request_unique_idx). Read/write access is governed entirely by RLS
 * (can_access_request_thread / messages_insert) — the request owner and joined
 * members, plus bidding/viewing guides and admins. Never import from a client
 * component.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MessageSenderRole, Uuid } from "@/lib/supabase/types";

export type GroupMessage = {
  id: string;
  body: string;
  senderId: string | null;
  senderRole: MessageSenderRole;
  createdAt: string;
};

const MESSAGE_SELECT = "id, body, sender_id, sender_role, created_at";

function mapMessage(row: {
  id: string;
  body: string;
  sender_id: string | null;
  sender_role: string;
  created_at: string;
}): GroupMessage {
  return {
    id: row.id,
    body: row.body,
    senderId: row.sender_id,
    senderRole: row.sender_role as MessageSenderRole,
    createdAt: row.created_at,
  };
}

/**
 * Returns the id of the request's group thread, creating it on first use. The
 * caller must be allowed to create it (RLS: can_create_conversation_thread).
 * Handles the create race via ct_request_unique_idx by re-selecting.
 */
export async function getOrCreateRequestThreadId(
  requestId: Uuid,
  createdBy: Uuid,
): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const existing = await supabase
    .from("conversation_threads")
    .select("id")
    .eq("request_id", requestId)
    .eq("subject_type", "request")
    .maybeSingle();
  if (existing.data?.id) return existing.data.id as string;

  const created = await supabase
    .from("conversation_threads")
    .insert({ subject_type: "request", request_id: requestId, created_by: createdBy })
    .select("id")
    .single();
  if (!created.error && created.data?.id) return created.data.id as string;

  // Lost the create race (unique index) — the thread now exists; re-select it.
  const retry = await supabase
    .from("conversation_threads")
    .select("id")
    .eq("request_id", requestId)
    .eq("subject_type", "request")
    .maybeSingle();
  if (retry.data?.id) return retry.data.id as string;

  throw created.error ?? new Error("Не удалось открыть обсуждение группы.");
}

export async function listRequestThreadMessages(
  threadId: string,
): Promise<GroupMessage[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data ?? []).map(mapMessage);
}

/**
 * Read-only load of the group thread's messages for a page render. Does NOT
 * create the thread (avoids a write on GET); the thread is created lazily on the
 * first post via postRequestGroupMessage. Returns an empty list when no thread or
 * messages exist yet, or on a transient/permission error, so callers degrade
 * gracefully. RLS still governs what the viewer may read.
 */
export async function getRequestGroupThread(
  requestId: Uuid,
): Promise<{ messages: GroupMessage[] }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: thread } = await supabase
      .from("conversation_threads")
      .select("id")
      .eq("request_id", requestId)
      .eq("subject_type", "request")
      .maybeSingle();
    if (!thread?.id) return { messages: [] };
    return { messages: await listRequestThreadMessages(thread.id as string) };
  } catch {
    return { messages: [] };
  }
}

export async function postRequestThreadMessage(input: {
  threadId: string;
  senderId: Uuid;
  senderRole: MessageSenderRole;
  body: string;
}): Promise<GroupMessage> {
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
  return mapMessage(data);
}
