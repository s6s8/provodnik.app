import Link from "next/link";

interface ReqCardProps {
  href: string;
  location: string;
  spotsLabel: string;
  title: string;
  date: string;
  desc?: string;
  fillPct: number;
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
        {avatars && avatars.length > 0 ? (
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
