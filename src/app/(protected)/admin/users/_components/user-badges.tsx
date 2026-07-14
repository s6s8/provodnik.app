import { Badge } from "@/components/ui/badge";
import type { AppRole } from "@/lib/auth/types";
import {
  ACCOUNT_STATUS_LABELS,
  GUIDE_TYPE_LABELS,
  GUIDE_VERIFICATION_LABELS,
  ROLE_LABELS,
  type AccountStatus,
  type GuideType,
  type GuideVerificationStatus,
} from "@/data/admin-users";

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning";

const STATUS_VARIANT: Record<AccountStatus, BadgeVariant> = {
  active: "success",
  suspended: "destructive",
  archived: "secondary",
};

const GUIDE_VARIANT: Record<GuideVerificationStatus, BadgeVariant> = {
  approved: "success",
  submitted: "warning",
  rejected: "destructive",
  draft: "outline",
};

export function AccountStatusBadge({ status }: { status: AccountStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{ACCOUNT_STATUS_LABELS[status]}</Badge>;
}

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <Badge variant={role === "admin" ? "default" : "outline"}>{ROLE_LABELS[role]}</Badge>
  );
}

/**
 * Guides created before the signup phone gate (or through the old admin
 * role-flip bypass) have no phone. They stay publicly visible; this flags them
 * for admins. `phone` may be the masked variant — only emptiness matters.
 */
export function MissingPhoneBadge({
  role,
  phone,
}: {
  role: AppRole;
  phone: string | null;
}) {
  if (role !== "guide" || phone?.trim()) return null;
  return <Badge variant="destructive">нет телефона</Badge>;
}

export function GuideStatusBadge({
  status,
  guideType,
}: {
  status: GuideVerificationStatus;
  guideType: GuideType | null;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge variant={GUIDE_VARIANT[status]}>{GUIDE_VERIFICATION_LABELS[status]}</Badge>
      {guideType ? (
        <span className="text-xs text-muted-foreground">{GUIDE_TYPE_LABELS[guideType]}</span>
      ) : null}
    </span>
  );
}
