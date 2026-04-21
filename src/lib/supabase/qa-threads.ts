import { maskPii } from "@/lib/pii/mask";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QaMessage, QaThread } from "@/lib/supabase/qa-threads-types";
import { QA_MESSAGE_LIMIT } from "@/lib/supabase/qa-threads-types";

export type { QaMessage, QaThread };
export { QA_MESSAGE_LIMIT };

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

  // Atomically enforces 8-message limit via Postgres RPC — no TOCTOU
  const { error } = await supabase.rpc("send_qa_message", {
    p_thread_id: threadId,
    p_sender_id: senderId,
    p_sender_role: senderRole,
    p_body: body.trim(),
  });

  if (error) {
    if (error.message.includes("qa_thread_at_limit")) {
      throw new Error("qa_thread_at_limit");
    }
    throw error;
  }
}
