/**
 * Mirrors public.custom_access_token_hook claim shaping (AP-038).
 * Keep in sync with supabase/migrations/*_custom_access_token_hook*.sql.
 */
export function mergeProfileRoleIntoAccessTokenClaims(
  claims: Record<string, unknown>,
  profileRole: string,
): Record<string, unknown> {
  const existing = claims.app_metadata;
  const appMetadata =
    existing !== null &&
    typeof existing === "object" &&
    !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};

  return {
    ...claims,
    app_metadata: {
      ...appMetadata,
      role: profileRole,
    },
  };
}
