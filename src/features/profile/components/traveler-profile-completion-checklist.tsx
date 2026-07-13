import { Check, X } from "lucide-react";

import type { TravelerProfile } from "@/features/profile/components/traveler-profile-form";
import { getTravelerProfileSection2Checklist } from "@/lib/profile/traveler-profile-completion";

type Props = {
  profile: Pick<TravelerProfile, "full_name">;
};

export function TravelerProfileCompletionChecklist({ profile }: Props) {
  const checklist = getTravelerProfileSection2Checklist(profile);

  return (
    <section className="flex flex-col gap-4" aria-label={checklist.sectionTitle}>
      <h2 className="text-lg font-semibold text-foreground">{checklist.sectionTitle}</h2>
      <ul className="flex flex-col gap-3">
        {checklist.items.map((item) => (
          <li
            key={item.id}
            className="flex gap-3 rounded-card border border-border bg-surface-high p-4"
          >
            {item.complete ? (
              <Check
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-success"
              />
            ) : (
              <X
                aria-hidden
                className="mt-0.5 size-5 shrink-0 text-destructive"
              />
            )}
            <div className="min-w-0 flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">
                {item.complete
                  ? "Имя указано — гиды видят, к кому обращаются."
                  : "Добавьте имя, чтобы гиды понимали, к кому обращаются."}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
