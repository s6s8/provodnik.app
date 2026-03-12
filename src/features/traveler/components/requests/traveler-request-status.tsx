"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import type { TravelerRequestStatus } from "@/data/traveler-request/types";

export function TravelerRequestStatusBadge({
  status,
}: {
  status: TravelerRequestStatus;
}) {
  const label = React.useMemo(() => formatStatusLabel(status), [status]);
  const variant = React.useMemo(() => statusVariant(status), [status]);
  return <Badge variant={variant}>{label}</Badge>;
}

function formatStatusLabel(status: TravelerRequestStatus) {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "offers_received":
      return "Offers received";
    case "shortlisted":
      return "Shortlisted";
    case "booked":
      return "Booked";
    case "closed":
      return "Closed";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

function statusVariant(status: TravelerRequestStatus) {
  switch (status) {
    case "draft":
      return "outline" as const;
    case "submitted":
      return "secondary" as const;
    case "offers_received":
      return "default" as const;
    case "shortlisted":
      return "default" as const;
    case "booked":
      return "default" as const;
    case "closed":
      return "ghost" as const;
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

