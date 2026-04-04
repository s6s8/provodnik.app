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
            Продолжайте диалоги с гидами и держите детали поездки в одном месте.
          </p>
        </div>
      </div>
      <ConversationList initialThreads={threads} />
    </section>
  );
}
