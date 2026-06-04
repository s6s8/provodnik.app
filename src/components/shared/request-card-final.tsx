import Link from "next/link";
import { Check, Hand, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getTheme, type ThemeSlug } from "@/data/themes";
import { ThemeIconChip } from "./theme-icon-chip";

export type RequestCardFinalGroupType = "private" | "assembly";
export type RequestCardFinalGuideState = "waiting" | "found";

export type RequestCardFinalMember = {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl?: string;
};

export type RequestCardFinalProps = {
  href: string;
  location: string;
  date: string;
  groupType: RequestCardFinalGroupType;
  guideState: RequestCardFinalGuideState;
  datesFlexible?: boolean;
  interests?: readonly string[];
  members?: readonly RequestCardFinalMember[];
  price: string;
};

const datesFlexibleBadgeClassName =
  "rounded-full bg-surface-low px-2 py-0.5 text-xs font-medium text-ink-2";
const groupTypeBadgeBaseClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium";
const groupTypeBadgeOutlineClassName = `${groupTypeBadgeBaseClassName} border border-border text-ink-2`;
const groupTypeBadgePrimaryOutlineClassName = `${groupTypeBadgeBaseClassName} border border-primary/40 text-primary`;
const waitingGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning";
const foundGuideBadgeClassName =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success";

function getThemeSlugs(interests: readonly string[] | undefined): ThemeSlug[] {
  return (
    interests
      ?.slice(0, 3)
      .filter((slug): slug is ThemeSlug => getTheme(slug) != null) ?? []
  );
}

function GuideStatusBadge({ guideState }: { guideState: RequestCardFinalGuideState }) {
  if (guideState === "found") {
    return (
      <span className={foundGuideBadgeClassName}>
        Гид найден <Check size={14} className="text-success" />
      </span>
    );
  }

  return (
    <span className={waitingGuideBadgeClassName}>
      Ждёт гида <Hand size={14} className="text-warning" />
    </span>
  );
}

function getGroupLabel(groupType: RequestCardFinalGroupType) {
  return groupType === "private" ? "Своя группа" : "Открытая";
}

function GroupTypeBadge({ groupType }: { groupType: RequestCardFinalGroupType }) {
  const className = groupType === "assembly" ? groupTypeBadgePrimaryOutlineClassName : groupTypeBadgeOutlineClassName;
  const iconClassName = groupType === "assembly" ? "text-primary" : "text-ink-2";

  return (
    <span className={className}>
      <Users size={14} className={iconClassName} /> {getGroupLabel(groupType)}
    </span>
  );
}

function AvatarStack({ members }: { members: readonly RequestCardFinalMember[] }) {
  return (
    <div className="flex items-center">
      {members.slice(0, 5).map((member) => (
        <Avatar
          key={member.id}
          className="size-6 -ml-1.5 border-2 border-surface-high first:ml-0"
          title={member.displayName}
        >
          {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt={member.displayName} /> : null}
          <AvatarFallback className="bg-surface-low text-[0.5rem] font-semibold">
            {member.initials}
          </AvatarFallback>
        </Avatar>
      ))}
    </div>
  );
}

export function RequestCardFinal({
  href,
  location,
  date,
  groupType,
  guideState,
  datesFlexible = false,
  interests,
  members = [],
  price,
}: RequestCardFinalProps) {
  const themeSlugs = getThemeSlugs(interests);

  return (
    <article className="relative flex h-full flex-col rounded-card bg-surface-high p-4 shadow-card transition-transform hover:-translate-y-0.5">
      <div className="absolute right-4 top-4">
        <GuideStatusBadge guideState={guideState} />
      </div>

      <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <p className="truncate pr-24 text-lg font-semibold text-foreground">{location}</p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{date}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <GroupTypeBadge groupType={groupType} />
          {datesFlexible ? <span className={datesFlexibleBadgeClassName}>Гибкие даты</span> : null}
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <AvatarStack members={members} />
          {themeSlugs.length > 0 ? (
            <TooltipProvider>
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {themeSlugs.map((slug) => (
                  <ThemeIconChip key={slug} slug={slug} />
                ))}
              </div>
            </TooltipProvider>
          ) : null}
        </div>
        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-foreground">{price}</span>
      </div>
    </article>
  );
}
