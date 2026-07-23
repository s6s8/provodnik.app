const LEGACY_GUIDE_UUID_REDIRECT =
  /^\/guide\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Explicit public guide surfaces. Every other `/guide/*` path is the guide workspace
 * and stays behind the guide-role guard (secure default).
 */
export const PUBLIC_GUIDE_ROUTE_PATTERNS = [
  /^\/guides\/?$/,
  /^\/guides\/[^/]+\/?$/,
  LEGACY_GUIDE_UUID_REDIRECT,
] as const;

export function isPublicGuideRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PUBLIC_GUIDE_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}
