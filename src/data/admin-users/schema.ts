import { z } from "zod";

import { COPY } from "@/lib/copy";
import type { AppRole } from "@/lib/auth/types";

/**
 * Client-safe schema + label module for the admin user console (AP-014).
 * Zero server imports: server actions and client islands both import from here.
 */

export const ACCOUNT_STATUSES = ["active", "suspended", "archived"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Активен",
  suspended: "Заблокирован",
  archived: "В архиве",
};

export const ROLE_LABELS: Record<AppRole, string> = {
  traveler: "Путешественник",
  guide: COPY.guide,
  admin: "Администратор",
};

export const GUIDE_TYPES = [
  "individual_guide",
  "agency_representative",
  "guide_team",
] as const;
export type GuideType = (typeof GUIDE_TYPES)[number];

export const GUIDE_TYPE_LABELS: Record<GuideType, string> = {
  individual_guide: "Индивидуальный гид",
  agency_representative: "Представитель агентства",
  guide_team: "Команда гидов",
};

export const GUIDE_VERIFICATION_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
] as const;
export type GuideVerificationStatus = (typeof GUIDE_VERIFICATION_STATUSES)[number];

export const GUIDE_VERIFICATION_LABELS: Record<GuideVerificationStatus, string> = {
  draft: "Черновик",
  submitted: "На проверке",
  approved: "Одобрен",
  rejected: "Отклонён",
};

// --- Zod input schemas -----------------------------------------------------

const PII_PLACEHOLDER = "[скрыто]";
const EMAIL_IN_TEXT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const RU_PHONE_IN_TEXT = /(?:\+7|8|7)?[\s\-.(]*\d{3}[\s\-.)]*\d{3}[\s\-.]*\d{2}[\s\-.]*\d{2}/g;

export function scrubAdminReason(value: string): string {
  return value.replace(EMAIL_IN_TEXT, PII_PLACEHOLDER).replace(RU_PHONE_IN_TEXT, PII_PLACEHOLDER);
}

const uuid = z.string().uuid("Некорректный идентификатор пользователя.");
const reasonRequired = z
  .string()
  .trim()
  .min(3, "Укажите причину (минимум 3 символа).")
  .max(500, "Причина слишком длинная.")
  .transform(scrubAdminReason);

export const accountStatusSchema = z.enum(ACCOUNT_STATUSES);
export const roleSchema = z.enum(["traveler", "guide", "admin"]);

export const setAccountStatusInputSchema = z
  .object({
    targetUserId: uuid,
    status: accountStatusSchema,
    reason: z.string().trim().max(500).transform(scrubAdminReason).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status !== "active" && (!value.reason || value.reason.length < 3)) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Для блокировки или архивации нужна причина.",
      });
    }
  });
export type SetAccountStatusInput = z.infer<typeof setAccountStatusInputSchema>;

export const setRoleInputSchema = z.object({
  targetUserId: uuid,
  role: roleSchema,
  reason: reasonRequired,
});
export type SetRoleInput = z.infer<typeof setRoleInputSchema>;

/**
 * `profiles.full_name` is the private, legal-ish name — never the public one
 * (that lives in `guide_profiles.display_name`). Admins fix typos here.
 */
export const updateFullNameInputSchema = z.object({
  targetUserId: uuid,
  fullName: z
    .string()
    .trim()
    .min(1, "Укажите ФИО.")
    .max(120, "ФИО слишком длинное (максимум 120 символов)."),
});
export type UpdateFullNameInput = z.infer<typeof updateFullNameInputSchema>;

/** Typed-confirmation token the admin must enter to hard-delete a demo user. */
export const HARD_DELETE_CONFIRM_TEXT = "УДАЛИТЬ";

export const hardDeleteInputSchema = z.object({
  targetUserId: uuid,
  confirmText: z.string().trim(),
  reason: reasonRequired,
});
export type HardDeleteInput = z.infer<typeof hardDeleteInputSchema>;

export const BULK_ACTIONS = [
  "approve",
  "suspend",
  "reactivate",
  "archive",
] as const;
export type BulkAction = (typeof BULK_ACTIONS)[number];

export const bulkActionInputSchema = z
  .object({
    action: z.enum(BULK_ACTIONS),
    userIds: z.array(uuid).min(1, "Выберите хотя бы одного пользователя.").max(200),
    reason: z.string().trim().max(500).transform(scrubAdminReason).optional(),
  })
  .superRefine((value, ctx) => {
    const needsReason = value.action === "suspend" || value.action === "archive";
    if (needsReason && (!value.reason || value.reason.length < 3)) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Для блокировки или архивации нужна причина.",
      });
    }
  });
export type BulkActionInput = z.infer<typeof bulkActionInputSchema>;

// --- List filters ----------------------------------------------------------

export const ADMIN_USERS_PAGE_SIZE = 20;

export const adminUsersFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(["traveler", "guide", "admin"]).optional(),
  status: accountStatusSchema.optional(),
  guideStatus: z.enum(GUIDE_VERIFICATION_STATUSES).optional(),
  guideType: z.enum(GUIDE_TYPES).optional(),
  demo: z.enum(["demo", "real"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminUsersFilter = z.infer<typeof adminUsersFilterSchema>;

// --- Action result contract (client-safe) ----------------------------------

export type AdminActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

export type BulkActionResult = {
  ok: boolean;
  applied: number;
  skipped: number;
  message: string;
  /** Per-user skip reasons for the result summary (no PII). */
  skippedReasons?: string[];
};
