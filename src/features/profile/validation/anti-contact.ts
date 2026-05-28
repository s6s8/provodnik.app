const PHONE_RE = /(?:\+?\d[\s\-()]?){7,}/;
const EMAIL_RE = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/;
const TG_RE = /@[A-Za-z0-9_]{4,32}/;
const LINK_RE = /\b(?:https?:\/\/|www\.|t\.me\/)[^\s]+/;

export type ContactKind = "phone" | "email" | "telegram" | "link";

export function findContactInBio(
  text: string,
): { kind: ContactKind; match: string } | null {
  const checks = [
    ["link" as const, LINK_RE],
    ["email" as const, EMAIL_RE],
    ["telegram" as const, TG_RE],
    ["phone" as const, PHONE_RE],
  ] as const;

  for (const [kind, re] of checks) {
    const m = text.match(re);
    if (m) return { kind, match: m[0] };
  }
  return null;
}
