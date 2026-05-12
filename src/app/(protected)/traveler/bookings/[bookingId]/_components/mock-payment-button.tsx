'use client';

import * as React from "react";

import { Button } from "@/components/ui/button";

type MockPaymentButtonProps = {
  onClick?: () => void;
};

export function MockPaymentButton({ onClick: onClickProp }: MockPaymentButtonProps) {
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 2400);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="outline"
        className="w-fit text-muted-foreground"
        onClick={() => {
          onClickProp?.();
          setToastMsg("Имитация оплаты — в production будет реальный платёж");
        }}
      >
        «Я оплатил (имитация)»
      </Button>
      {toastMsg ? (
        <p className="text-xs text-muted-foreground" role="status">
          {toastMsg}
        </p>
      ) : null}
    </div>
  );
}
