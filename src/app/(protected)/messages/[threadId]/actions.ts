"use server";

import { z } from "zod";

import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import {
  markThreadRead,
  sendMessage,
  type Message,
} from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MessageSenderRole } from "@/lib/supabase/types";

const sendMessageSchema = z.object({
  threadId: z.string().uuid("Некорректный диалог."),
  body: z
    .string()
    .trim()
    .min(1, "Введите сообщение.")
    .max(5_000, "Сообщение не должно превышать 5000 символов."),
});

const markReadSchema = z.object({
  threadId: z.string().uuid("Некорректный диалог."),
});

async function getAuthorizedUser() {
  const auth = await readAuthContextFromServer();
  if (!auth.isAuthenticated) {
    throw new Error("Требуется авторизация.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Требуется авторизация.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const senderRole = (profile?.role ?? auth.role ?? "traveler") as MessageSenderRole;

  return {
    supabase,
    userId: user.id,
    senderRole,
  };
}

export async function sendMessageAction(
  threadId: string,
  body: string,
): Promise<
  | { success: true; message: Message }
  | { success: false; error: string }
> {
  const parsed = sendMessageSchema.safeParse({ threadId, body });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Не удалось отправить сообщение.",
    };
  }

  try {
    const { userId, senderRole } = await getAuthorizedUser();
    const message = await sendMessage(
      parsed.data.threadId,
      userId,
      senderRole,
      parsed.data.body,
    );

    return {
      success: true,
      message,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Не удалось отправить сообщение.",
    };
  }
}

export async function markReadAction(threadId: string) {
  const parsed = markReadSchema.safeParse({ threadId });

  if (!parsed.success) {
    return;
  }

  const { userId } = await getAuthorizedUser();
  await markThreadRead(parsed.data.threadId, userId);
}
