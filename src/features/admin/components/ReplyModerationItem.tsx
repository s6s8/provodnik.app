"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

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
import { ListRow } from "@/components/shared/list-row";
import { cn } from "@/lib/utils";
import {
  approveReply,
  rejectReply,
} from "@/features/admin/actions/moderateReply";
import { formatRussianDateTime } from "@/lib/dates";
import { maskPii } from "@/lib/pii/mask";

export interface ReplyModerationItemProps {
  reply: {
    id: string;
    review_id: string;
    body: string;
    submitted_at: string | null;
  };
  onAction: () => void;
}

export function ReplyModerationList({
  replies,
}: {
  replies: ReplyModerationItemProps["reply"][];
}) {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-2">
      {replies.map((reply) => (
        <ReplyModerationItem
          key={reply.id}
          reply={reply}
          onAction={() => router.refresh()}
        />
      ))}
    </div>
  );
}

export function ReplyModerationItem({ reply, onAction }: ReplyModerationItemProps) {
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleApprove() {
    setError(null);
    setBusy(true);
    try {
      await approveReply(reply.id);
      onAction();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось опубликовать");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmReject() {
    setError(null);
    setBusy(true);
    try {
      await rejectReply(reply.id);
      setRejectOpen(false);
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
        title={maskPii(reply.body)}
        subtitle={
          reply.submitted_at ? formatRussianDateTime(reply.submitted_at) : undefined
        }
        badge={<Badge>На проверке</Badge>}
        actions={
          <>
            <Button
              type="button"
              variant="success"
              loading={busy}
              disabled={busy}
              onClick={() => void handleApprove()}
            >
              <Check aria-hidden="true" />
              Опубликовать
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setError(null);
                setRejectOpen(true);
              }}
            >
              <X aria-hidden="true" />
              Отклонить
            </Button>
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
            setError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вернуть ответ гиду на доработку?</AlertDialogTitle>
            <AlertDialogDescription>
              Ответ вернётся в черновики, гид сможет его изменить.
            </AlertDialogDescription>
          </AlertDialogHeader>

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
                // A failed action must keep the dialog open with its error visible.
                event.preventDefault();
                void handleConfirmReject();
              }}
            >
              Вернуть на доработку
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
