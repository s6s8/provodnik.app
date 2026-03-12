"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDemoUserIdForRole } from "@/data/notifications/demo";
import {
  countUnreadNotificationsForUser,
  subscribeToNotificationsChanged,
} from "@/data/notifications/local-store";
import type { DemoRole, DemoSession } from "@/lib/demo-session";
import {
  clearDemoSessionFromDocument,
  readDemoSessionFromDocument,
  writeDemoSessionToDocument,
} from "@/lib/demo-session";
import type { AuthContext } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const roles = [
  {
    href: "/traveler",
    label: "Traveler",
    description: "Request and booking flow",
  },
  {
    href: "/guide",
    label: "Guide",
    description: "Supply, offers, operations",
  },
  {
    href: "/admin",
    label: "Admin",
    description: "Moderation and control",
  },
] as const;

function getActiveRoleLabel(pathname: string) {
  const match = roles.find(
    (role) => pathname === role.href || pathname.startsWith(`${role.href}/`)
  );
  return match?.label ?? "Workspace";
}

function getRoleFromPathname(pathname: string): DemoRole | null {
  const match = roles.find(
    (role) => pathname === role.href || pathname.startsWith(`${role.href}/`)
  );
  if (!match) return null;
  if (match.href === "/traveler") return "traveler";
  if (match.href === "/guide") return "guide";
  return "admin";
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
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    const session = readDemoSessionFromDocument();
    if (!session) return 0;
    return countUnreadNotificationsForUser(getDemoUserIdForRole(session.role));
  });

  const notificationsUserId = useMemo(() => {
    if (!demoSession) return null;
    return getDemoUserIdForRole(demoSession.role);
  }, [demoSession]);

  const hasSupabaseAuth = auth.hasSupabaseEnv && auth.isAuthenticated;
  const effectiveRole: DemoRole | null =
    (auth.role as DemoRole | null) ?? demoSession?.role ?? null;

  useEffect(() => {
    if (!notificationsUserId) return () => {};

    return subscribeToNotificationsChanged(() =>
      setUnreadNotifications(countUnreadNotificationsForUser(notificationsUserId))
    );
  }, [notificationsUserId]);

  function signInAs(role: DemoRole) {
    writeDemoSessionToDocument(role);
    setDemoSession(readDemoSessionFromDocument());
    setUnreadNotifications(
      countUnreadNotificationsForUser(getDemoUserIdForRole(role))
    );
    startTransition(() => router.refresh());
  }

  function signOut() {
    clearDemoSessionFromDocument();
    setDemoSession(null);
    setUnreadNotifications(0);
    startTransition(() => router.refresh());
  }

  return (
    <section
      className={cn(
        "border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      aria-label="Workspace navigation"
    >
      <div className="mx-auto w-full max-w-7xl px-6 py-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Workspace</p>
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
                    ? `Signed in · ${effectiveRole}`
                    : "Signed in"
                  : demoSession
                    ? `Demo: ${demoSession.role}`
                    : "Not signed in"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {auth.hasSupabaseEnv
                ? "Protected routes now respect Supabase auth; local demo session remains available for scaffolding."
                : "Protected routes are demo/session-aware locally and do not require Supabase keys."}
            </p>
          </div>
        </div>

        <nav className="mt-4" aria-label="Role destinations">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {roles.map((role) => {
              const isActive =
                pathname === role.href || pathname.startsWith(`${role.href}/`);

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
                title="Unified feed for marketplace events"
              >
                <Bell className="size-4" />
                Notifications
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
            {hasSupabaseAuth ? "Local demo session (optional)" : "Local demo session"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={demoSession?.role === "traveler" ? "secondary" : "outline"}
              disabled={isPending}
              onClick={() => signInAs("traveler")}
            >
              Traveler
            </Button>
            <Button
              type="button"
              size="sm"
              variant={demoSession?.role === "guide" ? "secondary" : "outline"}
              disabled={isPending}
              onClick={() => signInAs("guide")}
            >
              Guide
            </Button>
            <Button
              type="button"
              size="sm"
              variant={demoSession?.role === "admin" ? "secondary" : "outline"}
              disabled={isPending}
              onClick={() => signInAs("admin")}
            >
              Admin
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isPending || !demoSession}
              onClick={signOut}
            >
              Clear
            </Button>
          </div>
        </div>

        {pathRole && effectiveRole && effectiveRole !== pathRole ? (
          <div className="mt-4 rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Role boundary
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re viewing <span className="font-medium">{pathRole}</span>{" "}
              routes while signed in as{" "}
              <span className="font-medium">{effectiveRole}</span>.{" "}
              {hasSupabaseAuth
                ? "This is allowed in the MVP shell; stricter enforcement will follow."
                : "This is a demo-only state; real enforcement will be added when auth is wired."}
            </p>
          </div>
        ) : null}

        {!pathRole && effectiveRole ? (
          <div className="mt-4 rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              Session active
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re signed in as{" "}
              <span className="font-medium">{effectiveRole}</span>. Navigate to a
              protected role route to see boundary expectations.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

