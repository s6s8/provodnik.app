"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DemoRole, DemoSession } from "@/lib/demo-session";
import {
  clearDemoSessionFromDocument,
  readDemoSessionFromDocument,
  writeDemoSessionToDocument,
} from "@/lib/demo-session";
import {
  getDashboardPathForRole,
  getWorkspacePrefixForRole,
} from "@/lib/auth/role-routing";
import type { AuthContext } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const roles = [
  {
    role: "traveler",
    href: getDashboardPathForRole("traveler") ?? "/traveler/requests",
    workspacePrefix: getWorkspacePrefixForRole("traveler") ?? "/traveler",
    label: "Путешественник",
    description: "Заявки, общение с гидом и бронирование",
  },
  {
    role: "guide",
    href: getDashboardPathForRole("guide") ?? "/guide/dashboard",
    workspacePrefix: getWorkspacePrefixForRole("guide") ?? "/guide",
    label: "Гид",
    description: "Публикации, ответы на запросы, маршруты",
  },
  {
    role: "admin",
    href: getDashboardPathForRole("admin") ?? "/admin/dashboard",
    workspacePrefix: getWorkspacePrefixForRole("admin") ?? "/admin",
    label: "Оператор",
    description: "Модерация, споры и поддержка",
  },
] as const;

type WorkspaceRoleNavProps = {
  className?: string;
  auth: AuthContext;
};

export function WorkspaceRoleNav({ className, auth }: WorkspaceRoleNavProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [demoSession, setDemoSession] = useState<DemoSession | null>(() =>
    readDemoSessionFromDocument()
  );
  const unreadNotifications = 0;

  const hasSupabaseAuth = auth.hasSupabaseEnv && auth.isAuthenticated;
  const effectiveRole: DemoRole | null =
    (auth.role as DemoRole | null) ?? demoSession?.role ?? null;

  // Only show the tab for the current user's role
  const visibleRoles = roles.filter((r) => r.role === effectiveRole);

  function signInAs(role: DemoRole) {
    writeDemoSessionToDocument(role);
    setDemoSession(readDemoSessionFromDocument());
    startTransition(() => router.refresh());
  }

  function signOut() {
    clearDemoSessionFromDocument();
    setDemoSession(null);
    startTransition(() => router.refresh());
  }

  return (
    <section
      className={cn(
        "border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      aria-label="Навигация по рабочей области"
    >
      <div className="mx-auto w-full max-w-7xl px-6">
        <nav aria-label="Кабинет">
          <div className="flex items-center gap-1 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleRoles.map((role) => {
              const isActive =
                pathname === role.workspacePrefix ||
                pathname.startsWith(`${role.workspacePrefix}/`);

              return (
                <Button
                  key={role.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                  className={cn(
                    "shrink-0",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Link
                    href={role.href}
                    aria-current={isActive ? "page" : undefined}
                    title={role.description}
                  >
                    {role.label}
                  </Link>
                </Button>
              );
            })}

            {visibleRoles.length > 0 && (
              <div className="mx-1 h-5 w-px shrink-0 bg-border/60" aria-hidden="true" />
            )}

            <Button
              variant={pathname === "/notifications" ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "shrink-0",
                pathname === "/notifications" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Link
                href="/notifications"
                aria-current={pathname === "/notifications" ? "page" : undefined}
                title="Лента уведомлений"
              >
                <Bell className="size-4" />
                Уведомления
                {unreadNotifications > 0 && (
                  <Badge variant="secondary" className="ml-1.5 bg-background">
                    {unreadNotifications}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>
        </nav>

        {process.env.NODE_ENV !== "production" && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 py-2">
            <p className="text-xs text-muted-foreground">
              {hasSupabaseAuth ? "Демо (по желанию):" : "Демо-режим:"}
            </p>
            <Button
              type="button"
              size="sm"
              variant={demoSession?.role === "traveler" ? "secondary" : "outline"}
              disabled={isPending}
              onClick={() => signInAs("traveler")}
            >
              Путешественник
            </Button>
            <Button
              type="button"
              size="sm"
              variant={demoSession?.role === "guide" ? "secondary" : "outline"}
              disabled={isPending}
              onClick={() => signInAs("guide")}
            >
              Гид
            </Button>
            <Button
              type="button"
              size="sm"
              variant={demoSession?.role === "admin" ? "secondary" : "outline"}
              disabled={isPending}
              onClick={() => signInAs("admin")}
            >
              Оператор
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending || !demoSession}
              onClick={signOut}
            >
              Выйти из демо
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
