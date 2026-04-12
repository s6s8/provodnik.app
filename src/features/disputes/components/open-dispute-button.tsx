"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { openDispute } from "@/features/disputes/actions/openDispute";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function OpenDisputeButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await openDispute(bookingId, reason);
        setOpen(false);
        setReason("");
        router.push(`/disputes/${result.disputeId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось открыть спор.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          Открыть спор
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Открыть спор</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <label htmlFor="dispute-reason" className="text-sm font-medium text-foreground">
            Причина
          </label>
          <Textarea
            id="dispute-reason"
            value={reason}
            onChange={(ev) => setReason(ev.target.value)}
            maxLength={2000}
            placeholder="Опишите ситуацию"
            required
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            type="button"
            disabled={pending || !reason.trim()}
            onClick={handleConfirm}
          >
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
