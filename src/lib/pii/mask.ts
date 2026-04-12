/**
 * Tripster v1 — PII masking
 * Strips contact details from free-text fields before exposure to unauthenticated users.
 * Covers: Russian phone numbers, emails, Telegram handles/links,
 * WhatsApp links, VK profile links.
 */

const PATTERNS: RegExp[] = [
  // Russian phone numbers — all common formats
  // +7 (XXX) XXX-XX-XX, 8 (XXX) XXX XX XX, +7XXXXXXXXXX, 8XXXXXXXXXX, etc.
  /(?:\+7|8)[\s\-.(]?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}/g,
  // Plain 10-digit starting with 9 (mobile without country code)
  /\b9\d{2}[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}\b/g,
  // Email addresses
  /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
  // Telegram: @username or t.me/username
  /@[a-zA-Z][a-zA-Z0-9_]{4,31}/g,
  /(?:https?:\/\/)?t(?:elegram)?\.me\/[a-zA-Z][a-zA-Z0-9_]{4,31}/gi,
  // WhatsApp links
  /(?:https?:\/\/)?(?:wa|api)\.me\/\+?\d{7,15}/gi,
  /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/[^\s]*/gi,
  // VK profile links
  /(?:https?:\/\/)?(?:www\.)?vk(?:ontakte)?\.(?:com|ru)\/[a-zA-Z0-9_.]+/gi,
];

const PLACEHOLDER = "[контакт скрыт]";

/**
 * Mask all PII patterns in a string.
 * Returns the sanitised string. Safe to call on null/undefined (returns "").
 */
export function maskPii(text: string | null | undefined): string {
  if (!text) return "";
  let result = text;
  for (const pattern of PATTERNS) {
    // Reset lastIndex since we reuse the same RegExp instances with /g flag
    pattern.lastIndex = 0;
    result = result.replace(pattern, PLACEHOLDER);
  }
  return result;
}

/**
 * Returns true if the string contains any detectable PII.
 */
export function hasPii(text: string | null | undefined): boolean {
  if (!text) return false;
  for (const pattern of PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) return true;
  }
  return false;
}
