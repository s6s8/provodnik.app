import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cancellation policy",
  description: "How cancellations work for request-first tour bookings on Provodnik.",
};

export default function CancellationPolicyPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Public policy</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Cancellation policy
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          This is a product policy draft for the MVP baseline. It’s meant to set clear
          expectations, not to serve as final legal terms.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">Before confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              <li>
                A request is not a booking. Until it’s confirmed, either side can walk
                away with no penalty.
              </li>
              <li>
                If you’ve paid a deposit during request confirmation (when enabled),
                it follows the{" "}
                <Link href="/policies/refunds" className="underline underline-offset-4">
                  refund policy
                </Link>
                .
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">After confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Cancellation outcomes depend on timing and non-recoverable costs (tickets,
              permits, pre-paid transport). If there’s a conflict, we use the written
              confirmation as the source of truth.
            </p>
            <ul className="grid gap-2">
              <li>
                Traveler cancellations: we aim to refund what can reasonably be recovered,
                minus clearly documented third-party costs.
              </li>
              <li>
                Guide cancellations: travelers are eligible for a full refund of amounts
                paid for the booking, unless the traveler chooses an alternative.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">How to cancel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="grid gap-2">
            <li>
              Cancel in-app wherever the booking is managed (traveler or guide workspace),
              or by contacting support if in-app cancel is unavailable.
            </li>
            <li>
              Provide a short reason and any supporting context (e.g., flight changes) to
              speed up resolution.
            </li>
            <li>
              Refunds, when applicable, follow the{" "}
              <Link href="/policies/refunds" className="underline underline-offset-4">
                refund policy
              </Link>
              .
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">Last updated: Mar 2026.</p>
        </CardContent>
      </Card>
    </div>
  );
}

