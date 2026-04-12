"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { resolveDisputeThreadAction } from "@/features/disputes/actions/resolveDisputeThread";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  disputeId: string;
  adminId: string;
  disabled?: boolean;
};

export function DisputeAdminResolve({ disputeId, adminId, disabled }: Props) {
  const router = useRouter();
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClose() {
    setError(null);
    const text = resolution.trim();
    if (!text) {
      setError("Укажите решение.");
      return;
    }
    startTransition(async () => {
      try {
        await resolveDisputeThreadAction(disputeId, adminId, text);
        setResolution("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Не удалось закрыть спор.");
      }
    });
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="secondary" size="sm" disabled={disabled}>
          Решить
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[min(100vw-2rem,22rem)] p-3"
        align="end"
        onCloseAutoFocus={(ev) => ev.preventDefault()}
      >
        <p className="mb-2 text-sm font-medium text-foreground">Решение</p>
        <Textarea
          value={resolution}
          onChange={(ev) => setResolution(ev.target.value)}
          maxLength={4000}
          placeholder="Итоговое решение по спору"
          className="min-h-[100px]"
        />
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
        <Button
          type="button"
          className="mt-3 w-full"
          size="sm"
          disabled={pending}
          onClick={handleClose}
        >
          Закрыть спор
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
