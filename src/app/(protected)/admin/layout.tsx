import type { ReactNode } from "react";

import { redirect } from "next/navigation";

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

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();
  if (!auth.isAuthenticated) {
    redirect("/auth");
  }

  if (auth.role !== "admin") {
    redirect(auth.canonicalRedirectTo ?? "/auth");
  }

  const counts = await getAdminNavCounts();
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
                <p className="font-medium text-ink">Панель оператора</p>
                <p className="text-sm text-ink-3">{email}</p>
              </div>
            </div>
            <div className="h-px bg-[rgba(15,25,35,0.08)]" />
            <AdminSidebarNav counts={counts} />
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
      <AdminMobileTabs counts={counts} />
    </div>
  );
}
