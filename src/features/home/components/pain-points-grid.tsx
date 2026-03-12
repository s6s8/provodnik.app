import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const painPoints = [
  {
    title: "Fragmented traveler demand",
    description:
      "Requests currently leak across Telegram, phone calls, and personal contacts with no structured qualification.",
  },
  {
    title: "Manual group assembly",
    description:
      "Budget-sensitive users have to find each other manually instead of joining a clear, shared request state.",
  },
  {
    title: "Weak unified trust layer",
    description:
      "Reputation, verification, and booking confidence are split across channels rather than attached to a single transaction.",
  },
  {
    title: "Guide-side operational drag",
    description:
      "High commission and poor lead quality waste guide time and margin before the tour even starts.",
  },
];

export function PainPointsGrid() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Pain points the MVP is designed to remove
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          The baseline is deliberately shaped around marketplace friction, not
          around generic brochure-site concerns.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {painPoints.map((painPoint) => (
          <Card key={painPoint.title} className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">{painPoint.title}</CardTitle>
              <CardDescription className="leading-6">
                {painPoint.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-muted-foreground">
              Captured directly in the MVP scope and release slices documented
              in `MVP.md`.
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
