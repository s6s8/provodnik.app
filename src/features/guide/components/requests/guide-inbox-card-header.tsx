import { ProfileAvatar } from "@/components/profile-avatar";
import { INTEREST_CHIPS } from "@/data/interests";
import type { RequestRecord } from "@/data/supabase/queries";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";

const INTEREST_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map(({ id, label }) => [id, label]),
);


export function GuideInboxCardHeader({
  item,
  matched,
}: {
  item: RequestRecord;
  matched: boolean;
}) {
  const travelerDisplayName = resolveDisplayName(
    "traveler",
    { full_name: item.requesterName ?? null },
    { context: "inbox-card" },
  );

  return (
    <div className="flex items-start gap-3">
      <ProfileAvatar
        profile={{
          full_name: item.requesterName ?? null,
          avatar_url: item.requesterAvatarUrl ?? null,
        }}
        size={40}
        className="shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {travelerDisplayName}
        </p>
        <p className="text-sm text-muted-foreground">
          {item.format ? <>{item.format} </> : null}в{" "}
          <span className="font-medium text-foreground">
            {item.destination}
          </span>
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pt-0.5">
        {item.interests.length > 0 ? (
          <span
            className={
              matched
                ? "inline-flex items-center gap-1.5 whitespace-normal rounded-full bg-primary/10 px-2.5 py-1 font-sans text-[11px] font-semibold tracking-[0.02em] text-primary"
                : "inline-flex items-center gap-1.5 whitespace-normal rounded-full bg-muted px-2.5 py-1 font-sans text-[11px] font-medium tracking-[0.02em] text-muted-foreground"
            }
          >
            {item.interests.map((s) => INTEREST_LABEL_BY_ID[s] ?? s).join(" · ")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
