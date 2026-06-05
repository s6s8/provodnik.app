"use client";

import Link from "next/link";
import { Calendar, HelpCircle, LogOut, Map, User } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { AppRole } from "@/lib/auth/types";

const roleLabels: Record<AppRole, string> = {
  traveler: "Путешественник",
  guide: "Гид",
  admin: "Администратор",
};

type UserAccountDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
  role: AppRole | null;
};

export function UserAccountDrawer({
  open,
  onOpenChange,
  email,
  fullName,
  avatarUrl,
  role,
}: UserAccountDrawerProps) {
  const displayName = fullName?.trim().split(/\s+/)[0] || email || "Гость";
  const profileHref = role === "guide" ? "/guide/profile" : "/profile/personal";

  function closeAndNavigate() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] bg-background text-foreground border-l border-border flex flex-col p-0">
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-border">
          <SheetTitle className="sr-only">Личное меню</SheetTitle>
          <SheetDescription className="sr-only">
            Профиль, помощь и выход из аккаунта.
          </SheetDescription>
          <div className="flex items-center gap-3">
            <ProfileAvatar
              profile={{ full_name: fullName ?? null, avatar_url: avatarUrl ?? null }}
              size={48}
              className="shrink-0 border-2 border-primary"
            />
            <div className="min-w-0 flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
              {role ? (
                <span className="inline-flex w-fit items-center rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {roleLabels[role]}
                </span>
              ) : null}
              {email ? (
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        <nav className="flex flex-col px-3 pt-3 flex-1" aria-label="Меню аккаунта">
          <Link
            href={profileHref}
            onClick={closeAndNavigate}
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-high transition-colors"
          >
            <User className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
            Мой профиль
          </Link>
          {role === "guide" && (
            <>
              <Link
                href="/guide/excursions"
                onClick={closeAndNavigate}
                className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-high transition-colors"
              >
                <Map className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
                Мои экскурсии
              </Link>
              <Link
                href="/guide/calendar"
                onClick={closeAndNavigate}
                className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-high transition-colors"
              >
                <Calendar className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
                Календарь
              </Link>
            </>
          )}
          <Link
            href="/help"
            onClick={closeAndNavigate}
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-high transition-colors"
          >
            <HelpCircle className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
            Помощь и поддержка
          </Link>

          <div className="h-px bg-border my-2" />

          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
            >
              <LogOut className="size-[18px] shrink-0" aria-hidden="true" />
              Выйти из аккаунта
            </button>
          </form>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
