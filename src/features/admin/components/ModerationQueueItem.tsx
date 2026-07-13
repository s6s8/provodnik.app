"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { ListRow } from "@/components/shared/list-row";
import {
  approveListing,
  rejectListing,
} from "@/features/admin/actions/moderateListing";
import { formatRussianDateTime } from "@/lib/dates";
import { maskPii } from "@/lib/pii/mask";
import type { ListingRow } from "@/lib/supabase/types";

const CANNED_REJECTION_REASONS = [
  "Неполное описание",
  "Некорректные фотографии",
  "Подозрение на мошенничество",
  "Нарушение правил платформы",
] as const;

export interface ModerationQueueItemProps {
  listing: Pick<
    ListingRow,
    | "id"
    | "title"
    | "region"
    | "exp_type"
    | "guide_id"
    | "created_at"
    | "description"
  >;
  onAction: () => void;
}

export function ModerationQueueList({
  listings,
}: {
  listings: ModerationQueueItemProps["listing"][];
}) {
  const router = useRouter();
  return (
    <div className="space-y-2">
      {listings.map((listing) => (
        <ModerationQueueItem
          key={listing.id}
          listing={listing}
          onAction={() => router.refresh()}
        />
      ))}
    </div>
  );
}

export function ModerationQueueItem({ listing, onAction }: ModerationQueueItemProps) {
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const maskedDescription = maskPii(listing.description);
  const subtitle = [listing.region, listing.exp_type].filter(Boolean).join(" · ");

  async function handleApprove() {
    setError(null);
    setBusy(true);
    try {
      await approveListing(listing.id);
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось одобрить");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmReject() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Укажите причину отклонения");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await rejectListing(listing.id, trimmed);
      setRejectOpen(false);
      setReason("");
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отклонить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <ListRow
        title={listing.title}
        subtitle={subtitle}
        badge={
          <div className="flex items-center gap-2">
            <Badge>На проверке</Badge>
            <span className="text-xs text-muted-foreground">
              {formatRussianDateTime(listing.created_at)}
            </span>
          </div>
        }
        actions={
          <>
            <Button
              type="button"
              size="sm"
              variant="success"
              disabled={busy}
              onClick={() => void handleApprove()}
            >
              Одобрить
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Ещё действия"
                  disabled={busy}
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => {
                    setError(null);
                    setRejectOpen(true);
                  }}
                >
                  Отклонить
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/listings/${listing.id}`}>Посмотреть объявление</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {error && !rejectOpen ? (
        <p className="px-1 text-sm text-destructive">{error}</p>
      ) : null}

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            setReason("");
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить объявление</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения — выберите готовую или впишите свою.
            </DialogDescription>
          </DialogHeader>

          {maskedDescription ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{maskedDescription}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {CANNED_REJECTION_REASONS.map((label) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReason(label)}
              >
                {label}
              </Button>
            ))}
          </div>

          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Текст причины…"
            aria-label="Причина отклонения"
            rows={4}
          />

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => setRejectOpen(false)}
            >
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void handleConfirmReject()}
            >
              Подтвердить отклонение
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
