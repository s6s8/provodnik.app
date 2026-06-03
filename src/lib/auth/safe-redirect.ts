import {
  getDashboardPathForRole,
  getRequiredRoleForPathname,
  roleHasAccess,
} from "@/lib/auth/role-routing";
import type { AppRole } from "@/lib/auth/types";

/**
 * Validates that a redirect target is a safe same-origin relative path.
 * Blocks open redirect attacks where ?next=https://evil.com is passed
 * as a query parameter to auth flows.
 */
export function safeRedirectPath(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  try {
    const parsed = new URL(raw, "http://localhost");
    if (parsed.hostname !== "localhost") return "/";
  } catch {
    return "/";
  }
  return raw;
}

export function isAdminWorkspacePath(path: string | null | undefined): boolean {
  if (!path?.trim()) return false;

  const safe = safeRedirectPath(path.trim());
  return safe === "/admin" || safe.startsWith("/admin/");
}

/** Build `/auth` with a safe `?next=` return path for gated routes. */
export function buildAuthLoginRedirect(nextPath: string | null | undefined): string {
  if (!nextPath?.trim()) return "/auth";

  const safe = safeRedirectPath(nextPath.trim());
  if (safe === "/") return "/auth";

  return `/auth?next=${encodeURIComponent(safe)}`;
}

/** After login, prefer a safe ?next= path; otherwise fall back to the role dashboard. */
export function resolvePostAuthRedirectPath(
  role: AppRole | null | undefined,
  next: string | null | undefined,
): string | null {
  const dashboard = getDashboardPathForRole(role);
  if (!role || !dashboard) return null;
  if (!next?.trim()) return dashboard;

  const safeNext = safeRedirectPath(next);
  if (safeNext === "/") return dashboard;

  const requiredRole = getRequiredRoleForPathname(safeNext);
  if (requiredRole && !roleHasAccess(role, requiredRole)) return dashboard;

  return safeNext;
}
