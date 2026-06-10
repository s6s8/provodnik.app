"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { TravelerRequestStatus } from "@/data/traveler-request/types";
import { cancelRequestAction } from "@/app/(protected)/traveler/requests/[requestId]/actions";

const CANCELLABLE: TravelerRequestStatus[] = [
  "submitted",
  "offers_received",
  "shortlisted",
  "booked",
];

interface Props {
  requestId: string;
  status: TravelerRequestStatus;
}

export function CancelRequestButton({ requestId, status }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!CANCELLABLE.includes(status)) return null;

  function handleConfirm() {
    const formData = new FormData();
    formData.set("request_id", requestId);
    startTransition(async () => {
      const result = await cancelRequestAction({ error: null }, formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
          Отменить запрос
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Отменить запрос?</AlertDialogTitle>
          <AlertDialogDescription>
            Гиды не смогут больше отвечать на этот запрос. Действие необратимо.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Назад</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Отменяю..." : "Отменить запрос"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
