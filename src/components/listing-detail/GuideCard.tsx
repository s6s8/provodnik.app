import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { GuideProfileRow } from "@/lib/supabase/types";
import { maskPii } from "@/lib/pii/mask";

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
    | "display_name"
    | "bio"
    | "average_rating"
    | "review_count"
    | "contact_visibility_unlocked"
  > | null;
}) {
  if (!guide) return null;

  const bio = maskPii(guide.bio);

  return (
    <Card className="bg-glass backdrop-blur-[20px] border border-glass-border shadow-glass rounded-glass">
      <CardContent className="flex gap-4 p-4">
        <Avatar className="h-14 w-14 shrink-0 rounded-full">
          <AvatarImage src={undefined} alt="" />
          <AvatarFallback>{initials(guide.display_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium leading-tight">{guide.display_name ?? "Гид"}</p>
          <p className="text-sm text-muted-foreground">
            ★ {guide.average_rating.toFixed(1)} · {guide.review_count} отзывов
          </p>
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
