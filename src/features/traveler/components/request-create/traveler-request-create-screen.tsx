import { RequestWizard } from "@/features/requests/components/request-wizard";

export function TravelerRequestCreateScreen() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 font-display text-[clamp(1.5rem,3vw,2rem)] font-semibold text-foreground">
        Новый запрос
      </h1>
      <RequestWizard />
    </div>
  );
}

