"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import type { GuideBookingStatus } from "@/data/guide-booking/types";

export function GuideBookingStatusBadge({
  status,
}: {
  status: GuideBookingStatus;
}) {
  const label = React.useMemo(() => formatStatusLabel(status), [status]);
  const variant = React.useMemo(() => statusVariant(status), [status]);
  return <Badge variant={variant}>{label}</Badge>;
}

function formatStatusLabel(status: GuideBookingStatus) {
  switch (status) {
    case "awaiting_confirmation":
      return "Awaiting confirmation";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "no_show":
      return "No-show";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function statusVariant(status: GuideBookingStatus) {
  switch (status) {
    case "awaiting_confirmation":
      return "secondary" as const;
    case "confirmed":
      return "default" as const;
    case "in_progress":
      return "default" as const;
    case "completed":
      return "outline" as const;
    case "cancelled":
      return "ghost" as const;
    case "no_show":
      return "destructive" as const;
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

