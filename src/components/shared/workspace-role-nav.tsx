"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

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
    href: getDashboardPathForRole("traveler") ?? "/traveler/dashboard",
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

function getActiveRoleLabel(pathname: string) {
  const match = roles.find(
    (role) =>
      pathname === role.workspacePrefix ||
      pathname.startsWith(`${role.workspacePrefix}/`)
  );
  return match?.label ?? "Кабинет";
}

function getRoleFromPathname(pathname: string): DemoRole | null {
  const match = roles.find(
    (role) =>
      pathname === role.workspacePrefix ||
      pathname.startsWith(`${role.workspacePrefix}/`)
  );
  return match?.role ?? null;
}

type WorkspaceRoleNavProps = {
  className?: string;
  auth: AuthContext;
};

export function WorkspaceRoleNav({ className, auth }: WorkspaceRoleNavProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const activeLabel = getActiveRoleLabel(pathname);
  const pathRole = useMemo(() => getRoleFromPathname(pathname), [pathname]);
  const [isPending, startTransition] = useTransition();
  const [demoSession, setDemoSession] = useState<DemoSession | null>(() =>
    readDemoSessionFromDocument()
  );
  const unreadNotifications = 0;

  const hasSupabaseAuth = auth.hasSupabaseEnv && auth.isAuthenticated;
  const effectiveRole: DemoRole | null =
    (auth.role as DemoRole | null) ?? demoSession?.role ?? null;

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
      <div className="mx-auto w-full max-w-7xl px-6 py-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Рабочая область</p>
              <Badge variant="outline" className="bg-background">
                {activeLabel}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  "bg-background",
                  !hasSupabaseAuth && !demoSession && "text-muted-foreground"
                )}
              >
                {hasSupabaseAuth
                  ? effectiveRole
                    ? `Вы вошли · ${effectiveRole}`
                    : "Вы вошли"
                  : demoSession
                    ? `Демо-режим: ${demoSession.role}`
                    : "Без входа"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {auth.hasSupabaseEnv
                ? "Каждая роль открывает только свой закрытый кабинет через Supabase-авторизацию."
                : "Без Supabase-ключей доступен локальный демо-режим с теми же ролевыми маршрутами."}
            </p>
          </div>
        </div>

        <nav className="mt-4" aria-label="Role destinations">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {roles.map((role) => {
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
                    isActive && "text-foreground",
                    !isActive && "text-muted-foreground"
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

            <div className="mx-1 h-6 w-px shrink-0 bg-border/60" aria-hidden="true" />

            <Button
              variant={pathname === "/notifications" ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "shrink-0",
                pathname === "/notifications" && "text-foreground",
                pathname !== "/notifications" && "text-muted-foreground"
              )}
            >
              <Link
                href="/notifications"
                aria-current={pathname === "/notifications" ? "page" : undefined}
                title="Лента уведомлений по событиям на площадке"
              >
                <Bell className="size-4" />
                Уведомления
                {demoSession && unreadNotifications > 0 ? (
                  <Badge variant="secondary" className="ml-2 bg-background">
                    {unreadNotifications}
                  </Badge>
                ) : null}
              </Link>
            </Button>
          </div>
        </nav>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {hasSupabaseAuth ? "Локальный демо-режим (по желанию)" : "Локальный демо-режим"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
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
        </div>

        {pathRole && effectiveRole && effectiveRole !== pathRole ? (
          <div className="mt-4 rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Права доступа
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Этот раздел закреплён за ролью{" "}
              <span className="font-medium">{pathRole}</span>, войдя как{" "}
              <span className="font-medium">{effectiveRole}</span>.{" "}
              {hasSupabaseAuth
                ? "После проверки сессии пользователь перенаправляется в свой рабочий кабинет."
                : "В демо-режиме переключите роль на соответствующую, чтобы открыть нужный кабинет."}
            </p>
          </div>
        ) : null}

        {!pathRole && effectiveRole ? (
          <div className="mt-4 rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Сессия активна
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Вы вошли как{" "}
              <span className="font-medium">{effectiveRole}</span>. Откройте свой dashboard в навигации выше, чтобы перейти в закрытую рабочую область.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

