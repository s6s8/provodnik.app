import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConversationList } from "@/features/messaging/components/conversation-list";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { hasSupabaseEnv } from "@/lib/env";
import { getUserThreads } from "@/lib/supabase/conversations";

export const metadata: Metadata = {
  title: "Сообщения",
};

export default async function MessagesPage() {
  if (!hasSupabaseEnv()) {
    return (
      <section>
        <ConversationList initialThreads={[]} />
      </section>
    );
  }

  const auth = await readAuthContextFromServer();
  if (!auth.isAuthenticated || !auth.userId) {
    redirect("/auth");
  }

  const threads = await getUserThreads(auth.userId);

  return (
    <section className="grid gap-6">
      <ConversationList initialThreads={threads} />
    </section>
  );
}
