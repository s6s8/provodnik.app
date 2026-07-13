import { AlertTriangle, ShieldAlert, Snowflake, type LucideIcon } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";
import type { DisputeListItem } from "@/lib/supabase/disputes";

export type DisputeStatus = DisputeListItem["status"];
export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

/** Single source of truth for dispute status colour/copy. Consumed by the admin queue,
 *  the admin case detail and the traveler-facing dispute thread. */
export const DISPUTE_STATUS_META: Record<
  DisputeStatus,
  { label: string; variant: BadgeVariant; Icon: LucideIcon }
> = {
  open: { label: "Открыт", variant: "warning", Icon: AlertTriangle },
  under_review: { label: "В работе", variant: "info", Icon: ShieldAlert },
  resolved: { label: "Решён", variant: "success", Icon: Snowflake },
  closed: { label: "Закрыт", variant: "outline", Icon: Snowflake },
};

export function isDisputeStatus(status: string): status is DisputeStatus {
  return status in DISPUTE_STATUS_META;
}
