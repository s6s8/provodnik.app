import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  eyebrow: string;
  value: string;
  description: string;
};

export function MarketplaceMetricCard({ eyebrow, value, description }: Props) {
  return (
    <Card className="rounded-[1.8rem] border border-border/70 bg-white/78">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

