import type { GuideVerificationStatusDb } from "@/lib/supabase/types";

export type ChecklistStepStatus = "done" | "todo" | "locked";

export type ChecklistStep = {
  id: string;
  label: string;
  anchor: string;
  status: ChecklistStepStatus;
};

export type GuideProfileChecklistProps = {
  steps: ChecklistStep[];
  firstIncompleteStep: ChecklistStep | null;
  verificationStatus: GuideVerificationStatusDb;
};
