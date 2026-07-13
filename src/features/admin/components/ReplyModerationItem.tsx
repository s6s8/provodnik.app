"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

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
import { ListRow } from "@/components/shared/list-row";
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
    <div className="space-y-2">
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
    <div className="space-y-1.5">
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
        <p className="px-1 text-sm text-destructive">{error}</p>
      ) : null}

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Вернуть ответ гиду на доработку?</DialogTitle>
            <DialogDescription>
              Ответ вернётся в черновики, гид сможет его изменить.
            </DialogDescription>
          </DialogHeader>

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
              loading={busy}
              disabled={busy}
              onClick={() => void handleConfirmReject()}
            >
              Вернуть на доработку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
