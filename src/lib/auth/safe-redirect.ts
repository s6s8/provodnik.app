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
