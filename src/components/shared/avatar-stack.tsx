import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export type AvatarStackMember = {
  id: string;
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
};

type AvatarStackProps = {
  members: readonly AvatarStackMember[];
  /** Max avatars to render before collapsing the rest into a "+N" chip. */
  max?: number;
  /** Avatar diameter in px. */
  size?: number;
  /** Horizontal overlap in px (negative margin between avatars). */
  overlap?: number;
  /**
   * Total count the stack represents, when larger than `members.length`
   * (e.g. only a few member avatars were fetched but N people joined).
   * The "+N" chip is computed from this when provided.
   */
  totalCount?: number;
  className?: string;
};

/**
 * Overlapping circle stack of member avatars with an optional "+N" overflow
 * chip. Canonical primitive — reused by the trip panel and request cards.
 */
export function AvatarStack({
  members,
  max = 5,
  size = 26,
  overlap = 9,
  totalCount,
  className,
}: AvatarStackProps) {
  const shown = members.slice(0, max);
  const total = totalCount ?? members.length;
  const overflow = total - shown.length;
  const fontPx = Math.max(9, Math.round(size * 0.4));

  return (
    <div className={cn("flex items-center", className)}>
      {shown.map((member, index) => (
        <Avatar
          key={member.id}
          title={member.displayName}
          className="border-2 border-surface-lowest"
          style={{
            width: size,
            height: size,
            marginLeft: index === 0 ? 0 : -overlap,
          }}
        >
          {member.avatarUrl ? (
            <AvatarImage src={member.avatarUrl} alt={member.displayName} />
          ) : null}
          <AvatarFallback
            className="bg-surface-low font-semibold text-on-surface-muted"
            style={{ fontSize: fontPx }}
          >
            {member.initials}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 ? (
        <span
          className="grid place-items-center rounded-full border-2 border-surface-lowest bg-surface-low font-semibold text-on-surface-muted"
          style={{
            width: size,
            height: size,
            marginLeft: shown.length === 0 ? 0 : -overlap,
            fontSize: fontPx,
          }}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
