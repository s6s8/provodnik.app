import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "How refunds work for request-first tour bookings on Provodnik.",
};

export default function RefundPolicyPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Public policy</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Refund policy
        </h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          This is a product policy draft for launch credibility. It does not attempt to
          finalize legal language.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">When refunds apply</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              <li>
                If a guide cancels a confirmed booking and no acceptable alternative is
                arranged.
              </li>
              <li>
                If a booking can’t be delivered as confirmed (material mismatch vs.
                written confirmation).
              </li>
              <li>
                If a request is not confirmed (or is declined), any collected amount is
                refunded.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">What may be non-refundable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Some third-party costs can’t be recovered (tickets, permits, pre-paid
              transport). If these costs were explicitly approved in writing, they may be
              deducted from the refund.
            </p>
            <p>
              We aim to keep deductions rare, itemized, and tied to the booking’s written
              confirmation.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Timing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="grid gap-2">
            <li>
              Refund decisions are based on the booking confirmation, timestamps, and any
              supporting evidence provided through the dispute flow.
            </li>
            <li>
              Once approved, refunds are processed back to the original payment method
              where possible. Bank processing times vary.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">Last updated: Mar 2026.</p>
        </CardContent>
      </Card>
    </div>
  );
}

