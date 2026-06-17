import { ProfileAvatar } from "@/components/profile-avatar";
import { INTEREST_CHIPS } from "@/data/interests";
import type { RequestRecord } from "@/data/supabase/queries";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";

const INTEREST_LABEL_BY_ID: Record<string, string> = Object.fromEntries(
  INTEREST_CHIPS.map(({ id, label }) => [id, label]),
);


function formatPublishedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <ProfileAvatar
          profile={{
            full_name: item.requesterName ?? null,
            avatar_url: item.requesterAvatarUrl ?? null,
          }}
          size={44}
          className="shrink-0 ring-2 ring-white"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-sm font-semibold leading-snug text-[var(--on-surface-muted)]">
            {travelerDisplayName}
          </p>
          <p className="text-xl font-semibold leading-tight text-[var(--on-surface)]">
            {item.destination}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--on-surface-muted)]">
          <span className="size-2 rounded-full bg-[var(--gold)]" aria-hidden="true" />
          Новый · {formatPublishedAt(item.createdAt)}
        </span>
        {item.interests.length > 0 ? (
          <span
            className={
              matched
                ? "inline-flex items-center gap-1.5 whitespace-normal rounded-full bg-[var(--brand-50)] px-3 py-1 text-xs font-semibold text-[var(--primary)]"
                : "inline-flex items-center gap-1.5 whitespace-normal rounded-full border border-[var(--outline)] bg-[var(--surface-lowest)] px-3 py-1 text-xs font-semibold text-[var(--on-surface-muted)]"
            }
          >
            {item.interests.map((s) => INTEREST_LABEL_BY_ID[s] ?? s).join(" · ")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
