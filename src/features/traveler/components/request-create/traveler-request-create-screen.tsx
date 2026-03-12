import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TravelerRequestCreateForm } from "@/features/traveler/components/request-create/traveler-request-create-form";

export function TravelerRequestCreateScreen() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">Traveler workspace</Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Create a travel request
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground">
            Capture what you need in a structured way so guides can respond with
            comparable offers. This is frontend-only for now; your request stays
            on this device.
          </p>
        </div>
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader className="space-y-1">
          <CardTitle>Request details</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add the minimum needed for a good first response.
          </p>
        </CardHeader>
        <CardContent>
          <TravelerRequestCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}

