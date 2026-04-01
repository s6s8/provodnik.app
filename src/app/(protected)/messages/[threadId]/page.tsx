import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ChatInput } from "@/features/messaging/components/chat-input";
import { ChatWindow } from "@/features/messaging/components/chat-window";
import { hasSupabaseEnv } from "@/lib/env";
import { getThreadMessages, getUserThreads, markThreadRead } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { markReadAction, sendMessageAction } from "./actions";

export const metadata: Metadata = {
  title: "Сообщения",
};

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <section className="chat-page-shell">
        <div className="messages-page-header">
          <p className="sec-label">Сообщения</p>
          <h1 className="sec-title">Сообщения</h1>
          <p className="messages-page-description">
            Чат станет доступен после подключения Supabase.
          </p>
        </div>
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  let threads;
  let initialMessages;

  try {
    [threads, initialMessages] = await Promise.all([
      getUserThreads(user.id),
      getThreadMessages(threadId),
    ]);
  } catch {
    notFound();
  }

  const currentThread = threads.find((thread) => thread.id === threadId);

  if (!currentThread) {
    notFound();
  }

  await markThreadRead(threadId, user.id);

  const participantTitle =
    currentThread.other_participant_names.join(", ") || "Диалог";

  return (
    <section className="chat-page-shell">
      <div className="chat-page-header">
        <div>
          <p className="sec-label">Сообщения</p>
          <h1 className="sec-title">{participantTitle}</h1>
          <p className="messages-page-description">
            История переписки по текущей поездке и связанным деталям.
          </p>
        </div>
        <Link href="/messages" className="btn-ghost">
          Все диалоги
        </Link>
      </div>

      <div className="chat-page-frame glass-panel">
        <ChatWindow
          threadId={threadId}
          currentUserId={user.id}
          initialMessages={initialMessages}
          markReadAction={markReadAction}
        />
        <ChatInput threadId={threadId} sendMessageAction={sendMessageAction} />
      </div>
    </section>
  );
}
