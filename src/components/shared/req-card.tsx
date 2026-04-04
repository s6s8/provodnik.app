import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export interface ReqCardMember {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl?: string;
}

interface ReqCardProps {
  href: string;
  location: string;
  spotsLabel: string;
  title: string;
  date: string;
  desc?: string;
  fillPct: number;
  members?: ReqCardMember[];
  avatars?: string[];
  price: string;
}

export function ReqCard({
  href,
  location,
  spotsLabel,
  title,
  date,
  desc,
  fillPct,
  members,
  avatars,
  price,
}: ReqCardProps) {
  return (
    <Link
      href={href}
      className="block bg-surface-high rounded-card p-5 shadow-card transition-transform hover:-translate-y-[3px] no-underline text-inherit"
    >
      <div className="mb-3.5 flex items-center justify-between gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>{location}</span>
        <span className="text-primary">{spotsLabel}</span>
      </div>

      <p className="mb-1.5 font-sans text-[1.125rem] font-semibold text-foreground">{title}</p>
      <p className="mb-2 text-[0.8125rem] text-muted-foreground">{date}</p>

      {desc ? <p className="mb-3.5 line-clamp-2 text-sm leading-[1.55] text-muted-foreground">{desc}</p> : null}

      <Progress value={Math.min(100, Math.max(0, fillPct))} className="mb-3.5 h-1" />

      <div className="flex items-center justify-between gap-3">
        {members && members.length > 0 ? (
          <div className="flex items-center">
            {members.slice(0, 5).map((m) => (
              <Avatar
                key={m.id}
                className="size-7 -ml-1.5 border-2 border-surface-high first:ml-0"
                title={m.displayName}
              >
                {m.avatarUrl ? <AvatarImage src={m.avatarUrl} alt={m.displayName} /> : null}
                <AvatarFallback className="bg-surface-low text-[0.5625rem] font-semibold">
                  {m.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : avatars && avatars.length > 0 ? (
          <div className="flex items-center">
            {avatars.map((initials, i) => (
              <Avatar
                key={i}
                className="size-7 -ml-1.5 border-2 border-surface-high first:ml-0"
              >
                <AvatarFallback className="bg-surface-low text-[0.5625rem] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : (
          <div />
        )}
        <span className="text-sm font-semibold text-foreground">{price}</span>
      </div>
    </Link>
  );
}
