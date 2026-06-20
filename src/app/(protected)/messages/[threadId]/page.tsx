import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/features/messaging/components/chat-input";
import { ChatWindow } from "@/features/messaging/components/chat-window";
import { hasSupabaseEnv } from "@/lib/env";
import { maskMessageBodies } from "@/lib/pii/mask";
import { getThreadMessages, getUserThreads, markThreadRead } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { markReadAction, sendMessageAction } from "./actions";

export const metadata: Metadata = {
  title: "Переписка",
};

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;

  if (!hasSupabaseEnv()) {
    return (
      <section className="grid gap-6">
        <PageHeader
          eyebrow="Сообщения"
          title="Сообщения"
          subtitle="Чат станет доступен после подключения Supabase."
        />
      </section>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/auth?next=/messages/${threadId}`);
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

  const displayMessages = maskMessageBodies(initialMessages);

  const participantTitle =
    currentThread.other_participant_names.join(", ") || "Диалог";

  return (
    <section className="grid gap-6">
      <PageHeader
        eyebrow="Сообщения"
        title={participantTitle}
        subtitle="История переписки по текущей поездке и связанным деталям."
        actions={
          <Button variant="outline" asChild>
            <Link href="/messages">Все диалоги</Link>
          </Button>
        }
      />

      <div className="grid min-h-[min(72vh,48rem)] max-md:min-h-auto overflow-hidden rounded-[1.25rem] border border-border bg-card shadow-sm">
        <ChatWindow
          threadId={threadId}
          currentUserId={user.id}
          initialMessages={displayMessages}
          markReadAction={markReadAction}
        />
        <ChatInput threadId={threadId} sendMessageAction={sendMessageAction} />
      </div>
    </section>
  );
}
