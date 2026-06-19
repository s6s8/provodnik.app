import { BadgeCheck, Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BiddingGuide } from "@/lib/supabase/requests-public";
import { pluralize } from "@/lib/utils";

function initialsFromName(fullName: string | null): string {
  if (!fullName) {
    return "Г";
  }

  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "Г";
}

/**
 * Visitor social-proof row: read-only mini cards for the verified guides already
 * bidding on the request. Renders nothing when no one has bid (zero fabrication).
 */
export function BiddingGuidesTeaser({ guides }: { guides: BiddingGuide[] }) {
  if (guides.length === 0) {
    return null;
  }

  const n = guides.length;

  return (
    <section className="flex flex-col gap-3">
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-on-surface-muted">
        ВАШИ ПРОВОДНИКИ
      </div>
      <p className="text-[15px] font-medium text-on-surface">
        {n} {pluralize(n, "проверенный гид", "проверенных гида", "проверенных гидов")} уже
        предлагают программу
      </p>
      <div className="flex flex-wrap gap-3">
        {guides.map((guide) => (
          <div
            key={guide.user_id}
            className="flex items-center gap-3 rounded-[14px] border border-border bg-surface-lowest px-4 py-3"
          >
            <Avatar className="size-10">
              <AvatarImage src={guide.avatar_url ?? undefined} alt={guide.full_name ?? "Гид"} />
              <AvatarFallback className="bg-surface-low font-semibold text-on-surface-muted">
                {initialsFromName(guide.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-on-surface">
                  {guide.full_name ?? "Гид"}
                </span>
                <span className="inline-flex items-center gap-1 text-[12px] font-medium text-success">
                  <BadgeCheck className="size-3.5" />
                  Проверен
                </span>
              </div>
              {guide.average_rating != null || guide.review_count != null ? (
                <span className="inline-flex items-center gap-1 text-[12.5px] text-on-surface-muted">
                  {guide.average_rating != null ? (
                    <>
                      <Star className="size-3.5 fill-current text-gold" />
                      {guide.average_rating}
                    </>
                  ) : null}
                  {guide.average_rating != null && guide.review_count != null ? " · " : null}
                  {guide.review_count != null ? (
                    <>
                      {guide.review_count}{" "}
                      {pluralize(guide.review_count, "отзыв", "отзыва", "отзывов")}
                    </>
                  ) : null}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
