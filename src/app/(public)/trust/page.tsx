import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Trust",
  description: "How Provodnik builds confidence in request-first bookings.",
};

export default function TrustPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Public policy</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Trust</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Provodnik is a request-first tours marketplace baseline. These statements
          describe intended product behavior for launch credibility — not finalized legal
          terms.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">What travelers can expect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              <li>
                Clear scope before you pay: itinerary, inclusions, meeting point, and
                any extra costs are confirmed in writing.
              </li>
              <li>
                Your money is tied to a specific booking. If a guide can’t deliver,
                we follow the{" "}
                <Link href="/policies/refunds" className="underline underline-offset-4">
                  refund policy
                </Link>
                .
              </li>
              <li>
                No surprise substitutions: if the guide changes, you can approve or
                cancel.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/80">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">What guides can expect</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ul className="grid gap-2">
              <li>
                Requests come with context (dates, group size, constraints) so you can
                accept with fewer back-and-forth messages.
              </li>
              <li>
                Cancellation rules are predictable and shared up-front via the{" "}
                <Link
                  href="/policies/cancellation"
                  className="underline underline-offset-4"
                >
                  cancellation policy
                </Link>
                .
              </li>
              <li>
                Disputes are handled with a “facts-first” approach: written confirmation
                and timestamps are the source of truth.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 bg-card/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base">Limits (MVP baseline)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <ul className="grid gap-2">
            <li>
              Provodnik does not replace visas, insurance, or local regulations — those
              remain the traveler’s responsibility.
            </li>
            <li>
              Weather, closures, and force majeure can affect routes. We aim to offer
              reasonable alternatives when possible.
            </li>
            <li>
              If anything is unclear, the written booking confirmation is what we use
              to resolve it.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">Last updated: Mar 2026.</p>
        </CardContent>
      </Card>
    </div>
  );
}

