import type { ReactNode } from "react";

import Link from "next/link";
import { redirect } from "next/navigation";

import { hasSupabaseAdminEnv } from "@/lib/env";
import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { getAdminNavCounts } from "@/lib/supabase/moderation";

import { AdminMobileTabs, AdminSidebarNav } from "./admin-sidebar-nav";

function getInitials(email: string | null) {
  if (!email) return "A";

  const [localPart] = email.split("@");
  const normalized = localPart.replace(/[^a-zа-яё0-9]+/gi, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "A";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function AdminAccessDenied({ returnTo }: { returnTo: string | null | undefined }) {
  return (
    <div className="mx-auto max-w-2xl rounded-[1.75rem] border border-destructive/30 bg-destructive/10 p-6 shadow-card">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-destructive">Админка недоступна</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Нужны права администратора
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Этот раздел доступен только администраторам Provodnik. Войдите под
          админским аккаунтом или обратитесь к владельцу доступа.
        </p>
      </div>

      <Link
        href={returnTo ?? "/auth"}
        className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {returnTo ? "Вернуться в свой кабинет" : "Войти в аккаунт"}
      </Link>
    </div>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();
  if (!auth.isAuthenticated) {
    redirect("/auth");
  }

  if (auth.role !== "admin" || auth.accountStatus !== "active") {
    return <AdminAccessDenied returnTo={auth.canonicalRedirectTo} />;
  }

  const counts = hasSupabaseAdminEnv()
    ? await getAdminNavCounts()
    : { guides: 0, listings: 0 };
  const email = auth.email ?? "admin@provodnik.app";
  const initials = getInitials(email);

  return (
    <div className="pb-24 md:pb-0">
      <div className="grid w-full gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="bg-surface-high rounded-card shadow-card p-5 lg:sticky lg:top-24 self-start max-lg:static sticky top-28 space-y-5 p-6">
            <div className="space-y-3">
              <div className="flex size-14 items-center justify-center rounded-full bg-brand-light font-display text-2xl font-semibold text-brand">
                {initials}
              </div>
              <div className="space-y-1">
                <p className="font-medium text-ink">Панель администратора</p>
                <p className="text-sm text-ink-3">{email}</p>
              </div>
            </div>
            <div className="h-px bg-border" />
            <AdminSidebarNav counts={counts} />
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
      <AdminMobileTabs counts={counts} />
    </div>
  );
}
