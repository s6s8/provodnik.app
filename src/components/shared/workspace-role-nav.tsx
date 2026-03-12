"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function WorkspaceRoleNav({ className }: { className?: string }) {
  const pathname = usePathname() ?? "/";
  const activeLabel = getActiveRoleLabel(pathname);

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
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Switch roles to review protected routes and shared shell behavior.
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
          </div>
        </nav>
      </div>
    </section>
  );
}

