import { BadgeCheck, Star } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { GuideProfileRow } from "@/lib/supabase/types";
import { maskPii } from "@/lib/pii/mask";
import { resolveDisplayName } from "@/lib/profile/resolve-display-name";
import { pluralize } from "@/lib/utils";

function initials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export function GuideCard({
  guide,
}: {
  guide: Pick<
    GuideProfileRow,
    | "user_id"
    | "slug"
    | "bio"
    | "average_rating"
    | "review_count"
    | "contact_visibility_unlocked"
    | "years_experience"
    | "specialties"
    | "languages"
    | "verification_status"
  > & { full_name?: string | null; avatar_url?: string | null } | null;
}) {
  if (!guide) return null;

  const bio = maskPii(guide.bio);
  const guideName = resolveDisplayName("guide", { full_name: guide.full_name });
  const isVerified = guide.verification_status === "approved";

  const roleParts: string[] = [];
  if (guide.languages.length > 0) roleParts.push(guide.languages.join(", "));
  if (guide.years_experience && guide.years_experience > 0) {
    roleParts.push(`${guide.years_experience} лет в туризме`);
  }
  const roleLine = roleParts.join(" · ");

  return (
    <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
      <CardContent className="flex gap-4 p-4">
        <Avatar className="size-[72px] shrink-0 rounded-[12px]">
          <AvatarImage src={guide.avatar_url ?? undefined} alt={guideName} className="object-cover" />
          <AvatarFallback className="rounded-[12px]">{initials(guideName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-center gap-1.5 text-[18px] font-bold leading-tight">
            {guideName}
            {isVerified ? <BadgeCheck className="size-[15px] text-[#2F8F66]" /> : null}
          </p>
          {roleLine ? (
            <p className="text-sm text-muted-foreground">{roleLine}</p>
          ) : null}
          {bio ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{bio}</p>
          ) : null}
          {guide.specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {guide.specialties.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[rgba(20,28,40,.05)] px-3 py-[4px] text-[12px] text-[#414B59]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          {guide.review_count > 0 ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-[13px] fill-[#D4872B] text-[#D4872B]" /> {guide.average_rating.toFixed(1)} · {guide.review_count} {pluralize(guide.review_count, "отзыв", "отзыва", "отзывов")}
            </p>
          ) : null}
          {guide.slug ? (
            <Link
              href={`/guides/${guide.slug}`}
              className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Профиль гида
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
