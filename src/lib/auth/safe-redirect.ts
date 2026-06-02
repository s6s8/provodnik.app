import { getDashboardPathForRole } from "@/lib/auth/role-routing";
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

/** After login, prefer a safe ?next= path; otherwise fall back to the role dashboard. */
export function resolvePostAuthRedirectPath(
  role: AppRole | null | undefined,
  next: string | null | undefined,
): string | null {
  const dashboard = getDashboardPathForRole(role);
  if (!dashboard) return null;
  if (!next?.trim()) return dashboard;

  const safeNext = safeRedirectPath(next);
  if (safeNext === "/") return dashboard;

  return safeNext;
}
