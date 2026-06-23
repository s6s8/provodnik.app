import type { ReactNode } from "react";

import { ConversationList } from "@/features/messaging/components/conversation-list";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { hasSupabaseEnv } from "@/lib/env";
import { getUserThreads, type UserThreadSummary } from "@/lib/supabase/conversations";

export default async function MessagesLayout({
  children,
}: {
  children: ReactNode;
}) {
  let threads: UserThreadSummary[] = [];
  let loadError = false;

  if (hasSupabaseEnv()) {
    const auth = await readAuthContextFromServer();
    if (auth.isAuthenticated && auth.userId) {
      try {
        threads = await getUserThreads(auth.userId);
      } catch {
        loadError = true;
      }
    }
  }

  return (
    <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6 lg:items-start">
      <aside className="hidden min-w-0 lg:block">
        <div className="lg:sticky lg:top-24">
          <ConversationList initialThreads={threads} error={loadError} />
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
