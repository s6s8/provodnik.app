"use client";

import { useActionState } from "react";
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
  const [state, formAction, pending] = useActionState(cancelRequestAction, { error: null });

  if (!CANCELLABLE.includes(status)) return null;

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
        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Назад</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name="request_id" value={requestId} />
            <AlertDialogAction type="submit" disabled={pending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {pending ? "Отменяю..." : "Отменить запрос"}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
