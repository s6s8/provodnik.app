import Image from "next/image";
import Link from "next/link";

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
    <Link href={href} className="req-card">
      <div className="req-card-top">
        <span>{location}</span>
        <span className="req-spots">{spotsLabel}</span>
      </div>

      <p className="req-title">{title}</p>
      <p className="req-meta">{date}</p>

      {desc ? <p className="req-desc">{desc}</p> : null}

      <div className="req-bar">
        <div
          className="req-bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, fillPct))}%` }}
        />
      </div>

      <div className="req-foot">
        {members && members.length > 0 ? (
          <div className="avatars">
            {members.slice(0, 5).map((m, i) => (
              <span
                key={m.id}
                className="avatar"
                title={m.displayName}
                style={{ marginLeft: i === 0 ? "0" : "-6px" }}
              >
                {m.avatarUrl ? (
                  <Image src={m.avatarUrl} alt={m.displayName} width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  m.initials
                )}
              </span>
            ))}
          </div>
        ) : avatars && avatars.length > 0 ? (
          <div className="avatars">
            {avatars.map((initials, i) => (
              <span
                key={i}
                className="avatar"
                style={{ marginLeft: i === 0 ? "0" : "-6px" }}
              >
                {initials}
              </span>
            ))}
          </div>
        ) : (
          <div />
        )}
        <span className="req-price">{price}</span>
      </div>
    </Link>
  );
}
