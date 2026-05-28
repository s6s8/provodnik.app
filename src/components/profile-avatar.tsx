import type { CSSProperties } from "react";

export type ProfileLike = {
  full_name: string | null;
  avatar_url: string | null;
};

export function ProfileAvatar({
  profile,
  size,
  className,
}: {
  profile: ProfileLike;
  size: number;
  className?: string;
}) {
  const name = profile.full_name?.trim() ?? "";
  const url = profile.avatar_url?.trim() ?? "";

  const baseStyle: CSSProperties = {
    width: size,
    height: size,
  };

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar URL may be off-domain
      <img
        src={url}
        alt={name || "avatar"}
        style={baseStyle}
        className={`rounded-full object-cover ${className ?? ""}`}
      />
    );
  }

  if (name) {
    const letter = name[0].toUpperCase();
    return (
      <span
        style={baseStyle}
        className={`rounded-full bg-muted flex items-center justify-center font-medium ${className ?? ""}`}
      >
        {letter}
      </span>
    );
  }

  return (
    <span
      data-testid="profile-avatar-empty"
      style={baseStyle}
      className={`rounded-full bg-muted ${className ?? ""}`}
    />
  );
}
