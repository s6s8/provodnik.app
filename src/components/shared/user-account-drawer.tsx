"use client";

import Link from "next/link";
import { HelpCircle, LogOut, Settings, User } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { AppRole } from "@/lib/auth/types";

const roleLabels: Record<AppRole, string> = {
  traveler: "Путешественник",
  guide: "Гид",
  admin: "Оператор",
};

type UserAccountDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string | null;
  role: AppRole | null;
};

function AvatarCircle({ initial }: { initial: string }) {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary/15 text-lg font-bold text-primary">
      {initial}
    </span>
  );
}

export function UserAccountDrawer({
  open,
  onOpenChange,
  email,
  role,
}: UserAccountDrawerProps) {
  const avatarInitial = email ? email[0].toUpperCase() : "?";
  const displayName = email ?? "Гость";

  function handleLogout() {
    window.location.href = "/api/auth/signout";
  }

  function closeAndNavigate() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[300px] bg-background text-foreground border-l border-border flex flex-col p-0">
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-border">
          <SheetTitle className="sr-only">Личное меню</SheetTitle>
          <div className="flex items-center gap-3">
            <AvatarCircle initial={avatarInitial} />
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
            href="/guide/profile"
            onClick={closeAndNavigate}
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-high transition-colors"
          >
            <User className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
            Мой профиль
          </Link>
          <Link
            href="/guide/profile"
            onClick={closeAndNavigate}
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-high transition-colors"
          >
            <Settings className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
            Настройки
          </Link>
          <Link
            href="/help"
            onClick={closeAndNavigate}
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-high transition-colors"
          >
            <HelpCircle className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
            Помощь и поддержка
          </Link>

          <div className="h-px bg-border my-2" />

          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
          >
            <LogOut className="size-[18px] shrink-0" aria-hidden="true" />
            Выйти из аккаунта
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
