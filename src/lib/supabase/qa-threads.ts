import { maskPii } from "@/lib/pii/mask";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface QaMessage {
  id: string;
  sender_role: "traveler" | "guide" | "system" | "admin";
  body: string;
  created_at: string;
}

export interface QaThread {
  thread_id: string;
  messages: QaMessage[];
  message_count: number;
  at_limit: boolean;
}

const QA_MESSAGE_LIMIT = 8;

/**
 * Get or create an offer Q&A thread.
 * subject_type = 'offer' — this is the correct enum value for threads linked to an offer.
 * There is NO 'qa' value in the thread_subject enum.
 */
export async function getOrCreateOfferQaThread(
  offerId: string,
  createdBy: string,
): Promise<string> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("conversation_threads")
    .select("id")
    .eq("offer_id", offerId)
    .eq("subject_type", "offer")
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversation_threads")
    .insert({ subject_type: "offer", offer_id: offerId, created_by: createdBy })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function getQaMessages(threadId: string): Promise<QaThread> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_role, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(QA_MESSAGE_LIMIT);

  if (error) throw error;

  const messages = (data ?? []).map((m) => ({
    ...m,
    body: maskPii(m.body),
  })) as QaMessage[];

  return {
    thread_id: threadId,
    messages,
    message_count: messages.length,
    at_limit: messages.length >= QA_MESSAGE_LIMIT,
  };
}

export async function sendQaMessage(
  threadId: string,
  senderId: string,
  senderRole: "traveler" | "guide",
  body: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("thread_id", threadId);

  if ((count ?? 0) >= QA_MESSAGE_LIMIT) {
    throw new Error("qa_thread_at_limit");
  }

  const { error } = await supabase.from("messages").insert({
    thread_id: threadId,
    sender_id: senderId,
    sender_role: senderRole,
    body: body.trim(),
  });

  if (error) throw error;
}
