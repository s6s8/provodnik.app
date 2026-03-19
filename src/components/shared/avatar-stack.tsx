import Image from "next/image";

import { cn } from "@/lib/utils";

export type AvatarStackItem = {
  id: string;
  label: string;
  imageUrl?: string;
  initials?: string;
};

function getInitials(label: string) {
  const words = label
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (words.length === 0) return "?";
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("");
}

export function AvatarStack({
  items,
  maxVisible = 4,
  size = "md",
  className,
}: {
  items: readonly AvatarStackItem[];
  maxVisible?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const visible = items.slice(0, maxVisible);
  const remaining = Math.max(0, items.length - visible.length);
  const sizeClass = size === "sm" ? "size-8 text-[10px]" : "size-10 text-xs";
  const overlapClass = size === "sm" ? "-ml-2" : "-ml-3";

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((item, index) => (
        <div
          key={item.id}
          title={item.label}
          className={cn(
            "relative overflow-hidden rounded-full border-2 border-background bg-secondary font-semibold text-secondary-foreground shadow-sm",
            sizeClass,
            index === 0 ? "ml-0" : overlapClass,
          )}
        >
          {item.imageUrl ? (
            <Image
              unoptimized
              src={item.imageUrl}
              alt={item.label}
              fill
              sizes={size === "sm" ? "32px" : "40px"}
              className="object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              {item.initials ?? getInitials(item.label)}
            </span>
          )}
        </div>
      ))}
      {remaining > 0 ? (
        <div
          className={cn(
            "relative flex items-center justify-center rounded-full border-2 border-background bg-muted font-semibold text-muted-foreground shadow-sm",
            sizeClass,
            visible.length === 0 ? "ml-0" : overlapClass,
          )}
        >
          +{remaining}
        </div>
      ) : null}
    </div>
  );
}
