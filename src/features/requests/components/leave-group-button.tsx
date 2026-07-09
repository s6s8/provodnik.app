"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { leaveRequestAction } from "@/features/requests/leave-request-action";

interface LeaveGroupButtonProps {
  requestId: string;
  className?: string;
}

export function LeaveGroupButton({ requestId, className }: LeaveGroupButtonProps) {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleLeave = async () => {
    const ok = await confirm({
      title: "Покинуть группу?",
      description:
        "Вы перестанете быть участником и потеряете доступ к обсуждению группы. " +
        "Если по группе уже есть бронь или предоплата, могут действовать условия отмены — " +
        "уточните их в заявке и подтверждении.",
      confirmText: "Покинуть",
      cancelText: "Остаться",
      destructive: true,
    });
    if (!ok) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await leaveRequestAction(requestId);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        onClick={handleLeave}
        disabled={isPending}
        variant="ghost"
        size="sm"
        className={className}
      >
        <LogOut className="size-4" aria-hidden="true" />
        {isPending ? "Выходим…" : "Покинуть группу"}
      </Button>
      {errorMsg ? (
        <p className="text-xs text-destructive" role="status">
          {errorMsg}
        </p>
      ) : null}
      {ConfirmDialog}
    </div>
  );
}
