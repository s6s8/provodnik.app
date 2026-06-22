import Link from "next/link"

import { AvatarStack } from "@/components/ui/avatar-stack"
import { Badge } from "@/components/ui/badge"
import { Chip } from "@/components/ui/chip"
import { Tag } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

type RequestCardProps = {
  request: {
    id: string
    destination: string
    dates: string
    groupSize?: number
    groupCapacity?: number
    organizerName?: string
    publishedAt?: string
    offerCount?: number
    memberAvatars?: string[]
    status?: string
    format?: "open" | "private"
  }
  className?: string
}

function RequestCard({ request, className }: RequestCardProps) {
  const hasSeats = request.groupSize != null && request.groupCapacity != null

  return (
    <Link href={`/requests/${request.id}`} className="group block">
      <div
        data-slot="request-card"
        className={cn(
          "bg-card border border-line rounded-lg p-4 flex flex-col gap-2 group-hover:shadow-lift transition-shadow",
          className
        )}
      >
        <h3 className="font-semibold text-on-surface">{request.destination}</h3>

        <div className="flex flex-wrap items-center gap-2">
          <Chip label="Даты" value={request.dates} />
          {hasSeats ? (
            <Chip
              label="Мест"
              value={`${request.groupSize}/${request.groupCapacity}`}
            />
          ) : null}
        </div>

        {request.format ? (
          <Tag color={request.format === "open" ? "green" : "primary"}>
            {request.format === "open" ? "Группа открыта" : "Своя группа"}
          </Tag>
        ) : null}

        {request.memberAvatars && request.memberAvatars.length > 0 ? (
          <AvatarStack
            users={request.memberAvatars.map((u) => ({ name: "", avatarUrl: u }))}
            size="compact"
          />
        ) : null}

        {request.offerCount != null ? (
          <p className="text-sm text-muted-foreground">
            {request.offerCount} предложений
          </p>
        ) : null}

        {request.organizerName ? (
          <p className="text-sm text-muted-foreground">
            {request.organizerName}
          </p>
        ) : null}

        {request.status ? <Badge>{request.status}</Badge> : null}
      </div>
    </Link>
  )
}

export { RequestCard }
