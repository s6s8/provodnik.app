"use client";

import Link from "next/link";
import { ArrowLeftRight, LogOut } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { AppRole } from "@/lib/auth/types";
import {
  accountMenuByRole,
  filterNavItemsByHiddenHrefs,
  roleSwitchByRole,
  type NavItem,
} from "@/lib/navigation";

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
  hiddenNavHrefs?: readonly string[];
};

export function UserAccountDrawer({
  open,
  onOpenChange,
  email,
  fullName,
  avatarUrl,
  role,
  hiddenNavHrefs = [],
}: UserAccountDrawerProps) {
  const displayName = fullName?.trim().split(/\s+/)[0] || email || "Гость";
  const accountItems: readonly NavItem[] = filterNavItemsByHiddenHrefs(
    role ? accountMenuByRole[role] : [],
    hiddenNavHrefs,
  );
  const roleSwitch =
    role === "guide"
      ? roleSwitchByRole.guide
      : role === "traveler"
        ? roleSwitchByRole.traveler
        : null;

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
                <span className="inline-flex w-fit items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
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
          {accountItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeAndNavigate}
                className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-high transition-colors"
              >
                <Icon className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          {roleSwitch ? (
            <Link
              href={roleSwitch.href}
              onClick={closeAndNavigate}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-surface-high transition-colors"
            >
              <ArrowLeftRight className="size-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
              {roleSwitch.label}
            </Link>
          ) : null}

          <div className="h-px bg-border my-2" />

          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
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
