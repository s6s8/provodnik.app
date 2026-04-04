import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
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
      <section className="grid gap-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">
              Сообщения
            </p>
            <h1 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
              Сообщения
            </h1>
            <p className="max-w-[42rem] text-[0.9375rem] leading-[1.65] text-muted-foreground">
              Чат станет доступен после подключения Supabase.
            </p>
          </div>
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
    <section className="grid gap-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-sans text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-muted-foreground mb-2">
            Сообщения
          </p>
          <h1 className="font-display text-[clamp(1.875rem,3.5vw,2.375rem)] font-semibold leading-[1.1]">
            {participantTitle}
          </h1>
          <p className="max-w-[42rem] text-[0.9375rem] leading-[1.65] text-muted-foreground">
            История переписки по текущей поездке и связанным деталям.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/messages">Все диалоги</Link>
        </Button>
      </div>

      <div className="grid min-h-[min(72vh,48rem)] max-md:min-h-auto overflow-hidden bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
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
