import { Star } from "lucide-react";
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
  > & { full_name?: string | null } | null;
}) {
  if (!guide) return null;

  const bio = maskPii(guide.bio);
  const guideName = resolveDisplayName("guide", { full_name: guide.full_name });

  return (
    <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
      <CardContent className="flex gap-4 p-4">
        <Avatar className="h-14 w-14 shrink-0 rounded-full">
          <AvatarImage src={undefined} alt="" />
          <AvatarFallback>{initials(guideName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium leading-tight">{guideName}</p>
          {guide.review_count > 0 ? (
            <p className="text-sm text-muted-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" /> {guide.average_rating.toFixed(1)} · {guide.review_count} {pluralize(guide.review_count, "отзыв", "отзыва", "отзывов")}
            </p>
          ) : null}
          {bio ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{bio}</p>
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
