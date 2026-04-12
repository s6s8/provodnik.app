import type { AppRole } from "@/lib/auth/types";

export const ROLE_DASHBOARD_PATHS = {
  traveler: "/traveler/dashboard",
  guide: "/guide/dashboard",
  admin: "/admin/dashboard",
} as const satisfies Record<AppRole, string>;

export const ROLE_WORKSPACE_PREFIXES = {
  traveler: "/traveler",
  guide: "/guide",
  admin: "/admin",
} as const satisfies Record<AppRole, `/${string}`>;

const ROLE_ORDER: AppRole[] = ["traveler", "guide", "admin"];

function isPathWithinTree(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

export function isAppRole(value: string | null | undefined): value is AppRole {
  return value === "traveler" || value === "guide" || value === "admin";
}

export function getDashboardPathForRole(role: AppRole | null | undefined): string | null {
  return role ? ROLE_DASHBOARD_PATHS[role] : null;
}

export function getWorkspacePrefixForRole(role: AppRole | null | undefined): string | null {
  return role ? ROLE_WORKSPACE_PREFIXES[role] : null;
}

export function getRequiredRoleForPathname(pathname: string | null | undefined): AppRole | null {
  if (!pathname) return null;

  if (isPathWithinTree(pathname, "/profile/guide")) {
    return "guide";
  }

  for (const role of ROLE_ORDER) {
    if (isPathWithinTree(pathname, ROLE_WORKSPACE_PREFIXES[role])) {
      return role;
    }
  }

  return null;
}

export function isProtectedRolePathname(pathname: string | null | undefined): boolean {
  return getRequiredRoleForPathname(pathname) !== null;
}

export function isRoleDashboardPathname(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return ROLE_ORDER.some((role) => pathname === ROLE_DASHBOARD_PATHS[role]);
}

export function getRedirectPathForRole(role: AppRole | null | undefined): string | null {
  return getDashboardPathForRole(role);
}

const ROLE_RANK: Record<AppRole, number> = { traveler: 0, guide: 1, admin: 2 };

export function roleHasAccess(userRole: AppRole, requiredRole: AppRole): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}
