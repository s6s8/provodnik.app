import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { readAuthContextFromServer } from "@/lib/auth/server-auth";
import { TravelerMobileTabs } from "@/app/(protected)/traveler/traveler-mobile-tabs";
import { TravelerNavItems } from "@/app/(protected)/traveler/traveler-nav-items";

export default async function TravelerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const auth = await readAuthContextFromServer();

  if (!auth.isAuthenticated) {
    redirect("/auth?next=/traveler/dashboard");
  }

  if (auth.role && auth.role !== "traveler") {
    redirect(auth.canonicalRedirectTo ?? "/");
  }

  const initials = getInitials(auth.email);

  return (
    <div className="pb-24 md:pb-0">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <WorkspaceSidebar initials={initials} email={auth.email} />
        <main className="min-w-0">{children}</main>
      </div>
      <TravelerMobileTabs />
    </div>
  );
}

function WorkspaceSidebar({
  initials,
  email,
}: {
  initials: string;
  email: string | null;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="bg-surface-high rounded-card shadow-card p-5 lg:sticky lg:top-24 self-start max-lg:static sticky top-28 space-y-5 p-6">
        <div className="space-y-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-brand-light font-display text-2xl font-semibold text-brand">
            {initials}
          </div>
          <div className="space-y-1">
            <p className="font-medium text-ink">Кабинет путешественника</p>
            <p className="text-sm text-ink-3">{email ?? "demo@provodnik.app"}</p>
          </div>
        </div>
        <div className="h-px bg-[rgba(15,25,35,0.08)]" />
        <nav className="space-y-2" aria-label="Traveler workspace">
          <TravelerNavItems />
        </nav>
      </div>
    </aside>
  );
}

function getInitials(email: string | null) {
  if (!email) return "П";
  const [localPart] = email.split("@");
  const normalized = localPart.replace(/[^a-zа-яё0-9]+/gi, " ").trim();
  const parts = normalized.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "П";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
