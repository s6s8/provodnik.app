"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingSubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingLabel: React.ReactNode;
};

export function PendingSubmitButton({
  children,
  disabled,
  pendingLabel,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || pending}
      loading={pending}
      aria-live="polite"
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}

export function PendingMenuSubmitButton({
  children,
  className,
  pendingLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel: React.ReactNode;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      aria-live="polite"
      className={cn("w-full cursor-pointer disabled:cursor-wait disabled:opacity-60", className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
