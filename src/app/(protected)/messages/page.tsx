import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MessagesSquare } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { ConversationList } from "@/features/messaging/components/conversation-list";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { hasSupabaseEnv } from "@/lib/env";
import { getUserThreads, type UserThreadSummary } from "@/lib/supabase/conversations";

export const metadata: Metadata = {
  title: "Сообщения",
};

export default async function MessagesPage() {
  if (!hasSupabaseEnv()) {
    return (
      <>
        <section className="grid gap-6 lg:hidden">
          <PageHeader eyebrow="Кабинет" title="Сообщения" />
          <ConversationList initialThreads={[]} />
        </section>
        <DesktopPlaceholder />
      </>
    );
  }

  const auth = await readAuthContextFromServer();
  if (!auth.isAuthenticated || !auth.userId) {
    redirect("/auth?next=/messages");
  }

  let threads: UserThreadSummary[] = [];
  let loadError = false;
  try {
    threads = await getUserThreads(auth.userId);
  } catch {
    loadError = true;
  }

  return (
    <>
      <section className="grid gap-6 lg:hidden">
        <PageHeader eyebrow="Кабинет" title="Сообщения" />
        <ConversationList initialThreads={threads} error={loadError} />
      </section>
      <DesktopPlaceholder />
    </>
  );
}

function DesktopPlaceholder() {
  return (
    <div className="hidden min-h-[min(72vh,48rem)] lg:flex lg:items-center lg:justify-center">
      <EmptyState
        icon={<MessagesSquare className="size-6" />}
        title="Выберите диалог"
        description="Выберите беседу слева, чтобы открыть переписку."
      />
    </div>
  );
}
