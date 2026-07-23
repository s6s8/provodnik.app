import { hasAdminRole } from "@/lib/auth/admin-access";
import { isPublicGuideRoute } from "@/lib/auth/public-guide-routes";
import type { AppRole } from "@/lib/auth/types";

export const ROLE_DASHBOARD_PATHS = {
  traveler: "/trips",
  guide: "/guide",
  admin: "/admin/dashboard",
} as const satisfies Record<AppRole, string>;

export const ROLE_WORKSPACE_PREFIXES = {
  traveler: "/trips",
  guide: "/guide",
  admin: "/admin",
} as const satisfies Record<AppRole, `/${string}`>;

const ROLE_ORDER: AppRole[] = ["traveler", "guide", "admin"];
const LEGACY_TRAVELER_WORKSPACE_PREFIX = ["/", "traveler"].join("");
const TRAVELER_ROLE_PREFIXES = [
  ROLE_WORKSPACE_PREFIXES.traveler,
  "/bookings",
  LEGACY_TRAVELER_WORKSPACE_PREFIX,
] as const;

// Personal-settings routes shared by every role: gate at the edge on
// authentication only (any role), matching the 307 that /trips + /bookings give
// unauthenticated visitors, instead of a page-only redirect that streams a 200.
const AUTHENTICATED_ONLY_PREFIXES = ["/account"] as const;

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

export function requiresAuthenticatedSession(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return AUTHENTICATED_ONLY_PREFIXES.some((prefix) => isPathWithinTree(pathname, prefix));
}

export function getRequiredRoleForPathname(pathname: string | null | undefined): AppRole | null {
  if (!pathname) return null;

  if (TRAVELER_ROLE_PREFIXES.some((prefix) => isPathWithinTree(pathname, prefix))) {
    return "traveler";
  }

  if (isPathWithinTree(pathname, ROLE_WORKSPACE_PREFIXES.admin)) {
    return "admin";
  }

  if (isPathWithinTree(pathname, ROLE_WORKSPACE_PREFIXES.guide)) {
    if (isPublicGuideRoute(pathname)) {
      return null;
    }
    return "guide";
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

// Strict role isolation: only exact match or admin (elevated) can access a route.
// Previously guide (rank 1) could access traveler routes (rank 0) via >= comparison.

export function roleHasAccess(userRole: AppRole, requiredRole: AppRole): boolean {
  if (userRole === requiredRole) return true;
  // Admin has elevated access to all routes
  if (userRole === "admin") return true;
  return false;
}

/** profiles.role is canonical for traveler/guide; admin may be granted by profile or JWT (AP-038). */
export function resolveCanonicalRole(input: {
  profileRole: string | null | undefined;
  appMetadataRole: string | null | undefined;
  /** Kept for caller compatibility; user_metadata.role is untrusted for authorization. */
  userMetadataRole?: string | null | undefined;
}): AppRole | null {
  if (hasAdminRole(input)) return "admin";
  if (isAppRole(input.profileRole)) return input.profileRole;
  if (isAppRole(input.appMetadataRole)) return input.appMetadataRole;
  return null;
}
