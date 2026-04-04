import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConversationList } from "@/features/messaging/components/conversation-list";
import { hasSupabaseEnv } from "@/lib/env";
import { getUserThreads } from "@/lib/supabase/conversations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Сообщения",
};

export default async function MessagesPage() {
  if (!hasSupabaseEnv()) {
    return (
      <section className="messages-page-shell">
        <div className="messages-page-header">
          <p className="sec-label">Сообщения</p>
          <h1 className="sec-title">Сообщения</h1>
          <p className="messages-page-description">
            Чат станет доступен после подключения Supabase.
          </p>
        </div>
        <ConversationList initialThreads={[]} />
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

  const threads = await getUserThreads(user.id);

  return (
    <section className="messages-page-shell">
      <div className="messages-page-header">
        <p className="sec-label">Сообщения</p>
        <h1 className="sec-title">Сообщения</h1>
        <p className="messages-page-description">
          Продолжайте диалоги с гидами и держите детали поездки в одном месте.
        </p>
      </div>
      <ConversationList initialThreads={threads} />
    </section>
  );
}
