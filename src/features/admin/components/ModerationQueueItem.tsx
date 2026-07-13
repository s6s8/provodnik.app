"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ListRow } from "@/components/shared/list-row";
import { cn } from "@/lib/utils";
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
    <div className="flex flex-col gap-2">
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
    <div className="flex flex-col gap-1.5">
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
              loading={busy}
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
        <Alert role="alert" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <AlertDialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            setReason("");
            setError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отклонить объявление</AlertDialogTitle>
            <AlertDialogDescription>
              Укажите причину отклонения — выберите готовую или впишите свою.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {maskedDescription ? (
            <p className="line-clamp-3 text-sm text-muted-foreground">{maskedDescription}</p>
          ) : null}

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={reason}
            onValueChange={(value) => {
              if (value) setReason(value);
            }}
            aria-label="Готовые причины отклонения"
            className="flex-wrap"
          >
            {CANNED_REJECTION_REASONS.map((label) => (
              <ToggleGroupItem
                key={label}
                value={label}
                className="data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`reject-reason-${listing.id}`}>
              Причина отклонения
            </Label>
            <Textarea
              id={`reject-reason-${listing.id}`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Текст причины…"
              rows={4}
            />
          </div>

          {error ? (
            <Alert role="alert" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              className={cn(buttonVariants({ variant: "destructive" }))}
              onClick={(event) => {
                // Validation may keep the dialog open — Radix would close it by default.
                event.preventDefault();
                void handleConfirmReject();
              }}
            >
              Подтвердить отклонение
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
