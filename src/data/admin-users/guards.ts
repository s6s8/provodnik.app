import type { AppRole } from "@/lib/auth/types";
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
