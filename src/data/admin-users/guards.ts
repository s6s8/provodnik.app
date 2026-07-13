import type { AppRole } from "@/lib/auth/types";
import { COPY } from "@/lib/copy";
import type { AccountStatus } from "./schema";

/**
 * Client-safe safety helpers for the admin user console. These are pure
 * functions (no server imports) so they can be shared by server actions AND
 * client islands, and unit-tested in isolation. They mirror the guards enforced
 * at the database boundary (admin_set_account_status RPC + RLS), giving
 * defense-in-depth: the UI blocks the action, the action re-checks, and the DB
 * refuses if either is bypassed.
 */

/**
 * Demo accounts are identified by a server-side domain allowlist, NOT by any
 * client-supplied flag. Only these users may ever be hard-deleted. `provodnik.app`
 * is intentionally excluded — those are real staff/admin accounts.
 */
export const DEMO_EMAIL_DOMAINS = ["example.com", "provodnik.test"] as const;

export type GuardResult =
  | { ok: true }
  | { ok: false; reason: string };

export function isDemoEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return (DEMO_EMAIL_DOMAINS as readonly string[]).includes(domain);
}

/**
 * Hard delete is permitted only for demo-domain, non-admin users. Real users are
 * never hard-deletable; admins are never hard-deletable (demote first).
 */
export function canHardDeleteUser(input: {
  email: string | null | undefined;
  role: AppRole;
}): GuardResult {
  if (input.role === "admin") {
    return { ok: false, reason: "Администраторов нельзя удалять. Сначала снимите роль." };
  }
  if (!isDemoEmail(input.email)) {
    return {
      ok: false,
      reason: "Удаление доступно только для демо-аккаунтов. Реальных пользователей удалять нельзя.",
    };
  }
  return { ok: true };
}

export function evaluateStatusChange(input: {
  currentStatus: AccountStatus;
  nextStatus: AccountStatus;
  isSelf: boolean;
  targetRole: AppRole;
  /** Count of OTHER active admins (excluding the target). */
  otherActiveAdminCount: number;
}): GuardResult {
  if (input.isSelf) {
    return { ok: false, reason: "Нельзя менять статус собственного аккаунта." };
  }
  if (input.currentStatus === input.nextStatus) {
    return { ok: false, reason: "Аккаунт уже в этом статусе." };
  }
  if (
    input.targetRole === "admin" &&
    input.nextStatus !== "active" &&
    input.otherActiveAdminCount === 0
  ) {
    return {
      ok: false,
      reason: "Нельзя заблокировать последнего активного администратора.",
    };
  }
  return { ok: true };
}

export function evaluateRoleChange(input: {
  isSelf: boolean;
  currentRole: AppRole;
  nextRole: AppRole;
  /** Count of OTHER active admins (excluding the target). */
  otherActiveAdminCount: number;
}): GuardResult {
  if (input.isSelf) {
    return { ok: false, reason: "Нельзя менять собственную роль." };
  }
  if (input.currentRole === input.nextRole) {
    return { ok: false, reason: "Пользователь уже в этой роли." };
  }
  if (
    input.currentRole === "admin" &&
    input.nextRole !== "admin" &&
    input.otherActiveAdminCount === 0
  ) {
    return {
      ok: false,
      reason: "Нельзя снять роль у последнего активного администратора.",
    };
  }
  return { ok: true };
}

/**
 * Decide what a flip-to-guide may write to `guide_profiles`.
 *
 * The bug (item 13, msgs 544–593): the role-flip path used to upsert `display_name`,
 * `verification_status` and `is_available` unconditionally, so every admin↔guide flip
 * overwrote an existing guide's public identity with their email local-part, reset them
 * to `draft` and hid them from `/guides`. Admins could not see it — RLS shows them
 * `profiles.full_name` while anonymous visitors read the clobbered
 * `guide_profiles.display_name`. Re-approving never healed it.
 *
 * An existing profile is therefore never rewritten. A new one falls back to the full
 * name and NEVER to the email local-part — that leak is the same bug. The email is not
 * a parameter here, so it cannot leak by construction.
 */
export function buildGuideRoleFlipWrite(
  existing: { user_id: string; verification_status: string } | null,
  input: { targetId: string; targetFullName: string | null },
):
  | { kind: "insert"; row: Record<string, unknown> }
  | { kind: "restore-visibility" }
  | { kind: "noop" } {
  if (existing) {
    // D-A1a: the demote path is what forced is_available=false, so re-promoting an
    // approved guide undoes exactly that and nothing else. A guide who wants to stay
    // hidden can re-toggle it themselves.
    return existing.verification_status === "approved"
      ? { kind: "restore-visibility" }
      : { kind: "noop" };
  }

  return {
    kind: "insert",
    row: {
      user_id: input.targetId,
      display_name: input.targetFullName?.trim() || COPY.guide,
      verification_status: "draft",
      is_available: false,
    },
  };
}

const MASK = "•••";

/** Mask an email for list/detail display (PII-012): first local char + domain. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return "—";
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 1) return `${MASK}${domain}`;
  return `${local[0]}${MASK}${domain}`;
}

/** Mask a phone for display (PII-012): reveal only the last two digits. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 2) return "—";
  return `··· ${digits.slice(-2)}`;
}
