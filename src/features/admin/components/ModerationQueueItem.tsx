"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  approveListing,
  rejectListing,
} from "@/features/admin/actions/moderateListing";
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
    <div className="space-y-4">
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
  const [showReject, setShowReject] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const maskedDescription = maskPii(listing.description);

  function runAfterSuccess() {
    onAction();
  }

  async function handleApprove() {
    setError(null);
    setBusy(true);
    try {
      await approveListing(listing.id);
      runAfterSuccess();
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
      setShowReject(false);
      setReason("");
      runAfterSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отклонить");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-border/70 bg-card/90">
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <CardTitle className="text-lg leading-snug">{listing.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{listing.region}</span>
              {listing.exp_type ? (
                <Badge variant="secondary">{listing.exp_type}</Badge>
              ) : null}
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/listings/${listing.id}`}>Посмотреть объявление</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {maskedDescription ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">{maskedDescription}</p>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {showReject ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Причина отклонения</p>
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
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={busy}
                onClick={() => void handleConfirmReject()}
              >
                Подтвердить отклонение
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => {
                  setShowReject(false);
                  setReason("");
                  setError(null);
                }}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy || showReject}
          className="border-[color-mix(in_srgb,var(--success)_35%,var(--border))] bg-[color-mix(in_srgb,var(--success)_14%,white_86%)] text-success hover:bg-[color-mix(in_srgb,var(--success)_20%,white_80%)]"
          onClick={() => void handleApprove()}
        >
          Одобрить
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={() => {
            setShowReject(true);
            setError(null);
          }}
        >
          Отклонить
        </Button>
      </CardFooter>
    </Card>
  );
}
