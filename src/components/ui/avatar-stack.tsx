import { cn } from "@/lib/utils"

type AvatarStackUser = {
  name: string
  avatarUrl?: string
}

type AvatarStackProps = {
  users: AvatarStackUser[]
  size?: "default" | "compact"
  max?: number
  className?: string
}

const sizeClass: Record<NonNullable<AvatarStackProps["size"]>, string> = {
  default: "size-[46px]",
  compact: "size-[34px]",
}

function AvatarStack({ users, size = "default", max, className }: AvatarStackProps) {
  const visible = max !== undefined ? users.slice(0, max) : users
  const overflow = max !== undefined ? users.length - max : 0
  const circle = sizeClass[size]

  return (
    <div className={cn("flex items-center", className)}>
      {visible.map((user, index) => (
        <div
          key={index}
          data-slot="avatar-stack-item"
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-full bg-primary-tint font-semibold text-primary ring-2 ring-card",
            circle,
            index > 0 && "-ml-3"
          )}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="size-full object-cover"
            />
          ) : (
            <span>{user.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
      ))}
      {overflow > 0 ? (
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-full bg-amber-tint font-semibold text-amber ring-2 ring-card",
            circle,
            visible.length > 0 && "-ml-3"
          )}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  )
}

export { AvatarStack }
