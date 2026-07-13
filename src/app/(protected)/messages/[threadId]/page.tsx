import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BadgeCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { ProfileAvatar } from "@/components/profile-avatar";
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

  const otherParticipantId =
    currentThread.participants.find((participant) => participant.user_id !== user.id)?.user_id ??
    null;

  let guidePublic: { avatar_url: string | null; full_name: string | null } | null = null;
  if (otherParticipantId) {
    try {
      const { data } = await supabase
        .from("v_guide_public_profile")
        .select("avatar_url, full_name")
        .eq("user_id", otherParticipantId)
        .maybeSingle();
      guidePublic = data;
    } catch {
      guidePublic = null;
    }
  }

  const isVerifiedGuide = guidePublic !== null;

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <ProfileAvatar
            profile={{ full_name: participantTitle, avatar_url: guidePublic?.avatar_url ?? null }}
            size={34}
          />
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-on-surface">
              {participantTitle}
            </span>
            {isVerifiedGuide ? (
              <BadgeCheck className="size-4 shrink-0 text-success" strokeWidth={2.3} />
            ) : null}
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/messages">Все диалоги</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        История переписки по текущей поездке и связанным деталям.
      </p>

      <div className="grid min-h-[min(72vh,48rem)] max-md:min-h-auto overflow-hidden rounded-card border border-border bg-card shadow-sm">
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
