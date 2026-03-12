"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import type { TravelerBookingStatus } from "@/data/traveler-booking/types";

export function TravelerBookingStatusBadge({
  status,
}: {
  status: TravelerBookingStatus;
}) {
  const label = React.useMemo(() => formatStatusLabel(status), [status]);
  const variant = React.useMemo(() => statusVariant(status), [status]);
  return <Badge variant={variant}>{label}</Badge>;
}

function formatStatusLabel(status: TravelerBookingStatus) {
  switch (status) {
    case "deposit_ready":
      return "Deposit ready";
    case "deposit_paid":
      return "Deposit paid";
    case "confirmed":
      return "Confirmed";
    case "in_progress":
      return "In progress";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function statusVariant(status: TravelerBookingStatus) {
  switch (status) {
    case "deposit_ready":
      return "secondary" as const;
    case "deposit_paid":
      return "default" as const;
    case "confirmed":
      return "default" as const;
    case "in_progress":
      return "default" as const;
    case "completed":
      return "outline" as const;
    case "cancelled":
      return "ghost" as const;
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

