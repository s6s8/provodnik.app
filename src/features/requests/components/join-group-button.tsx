"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { COPY } from "@/lib/copy";
import { joinRequestAction } from "@/features/requests/join-request-action";
import { PostJoinPanel } from "@/features/requests/components/post-join-panel";

interface JoinGroupButtonProps {
  requestId: string;
  className?: string;
  disabled?: boolean;
}

export function JoinGroupButton({ requestId, className, disabled }: JoinGroupButtonProps) {
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "joined" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handleJoin = () => {
    setErrorMsg(null);
    setStatus("loading");
    startTransition(async () => {
      const result = await joinRequestAction(requestId);
      if (result.error) {
        setStatus("error");
        setErrorMsg(result.error);
      } else {
        setStatus("joined");
      }
    });
  };

  if (status === "joined") {
    return <PostJoinPanel className={className} />;
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        onClick={handleJoin}
        disabled={isPending || status === "loading" || !!disabled}
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
    </div>
  );
}

