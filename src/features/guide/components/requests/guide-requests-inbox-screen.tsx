import Link from "next/link";

import { getSeededTravelerRequests } from "@/data/traveler-request/seed";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatExperienceType(value: string): string {
  switch (value) {
    case "city":
      return "City";
    case "nature":
      return "Nature";
    case "culture":
      return "Culture";
    case "food":
      return "Food";
    case "adventure":
      return "Adventure";
    case "relax":
      return "Relax";
    default:
      return value;
  }
}

export function GuideRequestsInboxScreen() {
  const items = getSeededTravelerRequests();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Badge variant="outline">Guide workspace</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Requests inbox
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Seeded traveler requests for MVP baseline. Open a request to draft an
            offer locally.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Incoming requests</CardTitle>
          <p className="text-sm text-muted-foreground">
            {items.length} seeded request{items.length === 1 ? "" : "s"}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="space-y-3">
                  <Link
                    href={`/guide/requests/${item.id}`}
                    className="block rounded-xl border border-border/70 bg-background/60 p-4 transition-colors hover:bg-background"
                    aria-label={`Open request from ${item.traveler.displayName}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {item.traveler.displayName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatExperienceType(item.request.experienceType)} in{" "}
                          <span className="font-medium text-foreground">
                            {item.request.destination}
                          </span>
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <p>
                        <span className="font-medium text-foreground">Dates:</span>{" "}
                        {item.request.startDate} to {item.request.endDate}
                      </p>
                      <p>
                        <span className="font-medium text-foreground">Group:</span>{" "}
                        {item.request.groupSize} · {item.request.groupPreference}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="font-medium text-foreground">Budget:</span>{" "}
                        RUB {item.request.budgetPerPersonRub.toLocaleString()} / person
                      </p>
                    </div>

                    {item.request.notes ? (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                        {item.request.notes}
                      </p>
                    ) : null}
                  </Link>

                  {index < items.length - 1 ? <Separator /> : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

