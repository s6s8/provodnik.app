/**
 * Documented test/demo sign-in emails (passwords live only in SQL migrations).
 * Keep in sync with supabase/migrations/*repair_checklist_credentials_by_email.sql
 */
export const CHECKLIST_ACCOUNT_EMAILS = [
  "admin@provodnik.test",
  "traveler@provodnik.test",
  "guide@provodnik.test",
  "admin@provodnik.app",
  "traveler@provodnik.app",
  "guide@provodnik.app",
] as const;

export type ChecklistAccountEmail = (typeof CHECKLIST_ACCOUNT_EMAILS)[number];
