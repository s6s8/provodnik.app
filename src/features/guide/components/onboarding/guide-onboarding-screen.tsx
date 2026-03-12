import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { GuideOnboardingForm } from "@/features/guide/components/onboarding/guide-onboarding-form";

export function GuideOnboardingScreen() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Guide workspace</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Guide onboarding and verification intake
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Capture profile basics and verification intake details. This is
            frontend-only for now; your data stays on this device.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="secondary">
            <Link href="/guide/requests">Open requests inbox</Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Intake</CardTitle>
          <p className="text-sm text-muted-foreground">
            Finish the basics so you can start creating listings once backend
            flows are connected.
          </p>
        </CardHeader>
        <CardContent>
          <GuideOnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}

