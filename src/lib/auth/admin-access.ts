import type { AppRole } from "@/lib/auth/types";

function isAppRole(value: unknown): value is AppRole {
  return value === "traveler" || value === "guide" || value === "admin";
}

export type RoleSources = {
  profileRole: string | null | undefined;
  appMetadataRole: string | null | undefined;
  userMetadataRole?: string | null | undefined;
};

/** True when any canonical role source marks the user as admin (AP-038). */
export function hasAdminRole(sources: RoleSources): boolean {
  return (
    sources.profileRole === "admin" ||
    sources.appMetadataRole === "admin"
  );
}

export function readJwtRole(user: {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
}): AppRole | null {
  const appMeta = user.app_metadata?.role;
  if (isAppRole(appMeta)) return appMeta;
  return null;
}

/** Server auth decision for admin-only flows (moderation, disputes, etc.). */
export function isAdminAuthUser(input: {
  profileRole: string | null | undefined;
  jwtRole: AppRole | null;
}): boolean {
  return input.profileRole === "admin" || input.jwtRole === "admin";
}
