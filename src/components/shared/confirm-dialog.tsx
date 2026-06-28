"use client";

import * as React from "react";

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
import { buttonVariants } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ControlledConfirmDialogProps = ConfirmOptions & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

/** Controlled canon confirm dialog. Prefer the {@link useConfirm} hook for imperative flows. */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  destructive = false,
}: ControlledConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className={description ? undefined : "sr-only"}>
            {description ?? "Подтвердите действие перед продолжением."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            className={
              destructive ? buttonVariants({ variant: "destructive" }) : undefined
            }
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Imperative confirm — replacement for window.confirm. Render `ConfirmDialog` once in the tree. */
export function useConfirm(): {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  ConfirmDialog: React.ReactNode;
} {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const settle = React.useCallback((value: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    resolve?.(value);
  }, []);

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) {
        settle(false);
      }
    },
    [settle],
  );

  const dialog = options ? (
    <ConfirmDialog
      {...options}
      open={open}
      onOpenChange={handleOpenChange}
      onConfirm={() => settle(true)}
    />
  ) : null;

  return { confirm, ConfirmDialog: dialog };
}
