"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { joinRequestAction } from "@/app/(protected)/traveler/requests/join-action";

interface JoinGroupButtonProps {
  requestId: string;
  className?: string;
}

export function JoinGroupButton({ requestId, className }: JoinGroupButtonProps) {
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "joined" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 2400);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const handleJoin = () => {
    setErrorMsg(null);
    setToastMsg(null);
    setStatus("loading");
    startTransition(async () => {
      const result = await joinRequestAction(requestId);
      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error);
      } else {
        setStatus("joined");
        setToastMsg("Вы присоединились к группе");
      }
    });
  };

  if (status === "joined") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-success/10 px-4 py-2 text-sm font-semibold text-success">
          ✓ Вы в группе
        </span>
        {toastMsg ? (
          <p className="text-xs text-on-surface-muted" role="status">
            {toastMsg}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={handleJoin}
        disabled={isPending || status === "loading"}
        variant="outline"
        size="sm"
        className={className}
      >
        {isPending || status === "loading" ? "Подождите…" : COPY.joinGroup}
      </Button>
      {status === "error" && errorMsg ? (
        <p className="text-xs text-destructive" role="status">
          {errorMsg}
        </p>
      ) : null}
      {toastMsg ? (
        <p className="text-xs text-on-surface-muted" role="status">
          {toastMsg}
        </p>
      ) : null}
    </div>
  );
}

