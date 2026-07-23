/**
 * request-thread.ts — Open-group shared discussion service layer (server-only).
 *
 * One `subject_type='request'` conversation thread per open request (enforced by
 * ct_request_unique_idx). Read/write access is governed entirely by RLS
 * (can_access_request_thread / messages_insert) — the request owner and joined
 * members, plus bidding/viewing guides and admins. Never import from a client
 * component.
 */

import { maskPii } from "@/lib/pii/mask";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import type { MessageSenderRole, Uuid } from "@/lib/supabase/types";

export type GroupMessage = {
  id: string;
  body: string;
  senderId: string | null;
  senderRole: MessageSenderRole;
  senderDisplayName: string;
  createdAt: string;
};

const MESSAGE_SELECT = "id, body, sender_id, sender_role, created_at";

function mapMessage(
  row: {
    id: string;
    body: string;
    sender_id: string | null;
    sender_role: string;
    created_at: string;
  },
  senderDisplayName: string,
): GroupMessage {
  return {
    id: row.id,
    body: maskPii(row.body),
    senderId: row.sender_id,
    senderRole: row.sender_role as MessageSenderRole,
    senderDisplayName,
    createdAt: row.created_at,
  };
}

async function listSenderDisplayNames(
  senderIds: string[],
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(senderIds.filter(Boolean))];
  const result = new Map<string, string>();
  if (!uniqueIds.length) return result;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .in("id", uniqueIds);
  if (error) throw error;

  for (const row of data ?? []) {
    const role = row.role === "guide" ? "guide" : "traveler";
    result.set(
      row.id,
      resolveDisplayName(role, { full_name: row.full_name }, { context: "trusted" }),
    );
  }

  return result;
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
  const rows = data ?? [];
  const senderNames = await listSenderDisplayNames(
    rows.map((row) => row.sender_id as string | null).filter(Boolean) as string[],
  );
  return rows.map((row) =>
    mapMessage(
      row,
      row.sender_id
        ? senderNames.get(row.sender_id) ??
            resolveDisplayName(
              row.sender_role === "guide" ? "guide" : "traveler",
              {},
              { context: "trusted" },
            )
        : resolveDisplayName("traveler", {}, { context: "trusted" }),
    ),
  );
}

/**
 * Read-only load of the group thread's messages for a page render. Does NOT
 * create the thread (avoids a write on GET); the thread is created lazily on the
 * first post via postRequestGroupMessage. Returns an empty list when no thread or
 * messages exist yet. Transient/permission failures surface `loadError` so the
 * UI can distinguish a failed load from a genuinely empty thread.
 */
export async function getRequestGroupThread(
  requestId: Uuid,
): Promise<{ messages: GroupMessage[]; loadError?: boolean }> {
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
    return { messages: [], loadError: true };
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
  const senderNames = await listSenderDisplayNames([input.senderId]);
  return mapMessage(
    data,
    senderNames.get(input.senderId) ??
      resolveDisplayName(
        input.senderRole === "guide" ? "guide" : "traveler",
        {},
        { context: "trusted" },
      ),
  );
}
