"use client";

import * as React from "react";
import { X } from "lucide-react";

interface ContactUnlockRevealProps {
  guideName: string;
  guidePhone?: string | null;
  guideTelegram?: string | null;
  onDismiss: () => void;
}

export function ContactUnlockReveal({
  guideName,
  guidePhone,
  guideTelegram,
  onDismiss,
}: ContactUnlockRevealProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-full max-w-sm px-4 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className="relative rounded-2xl border border-primary/30 bg-background p-5 shadow-xl ring-1 ring-primary/20">
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: "0 0 24px rgba(var(--primary-rgb, 99, 102, 241), 0.15)",
          }}
          aria-hidden
        />

        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>

        <div className="space-y-2 pr-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Контакты открыты
          </p>
          <p className="font-semibold text-foreground">
            Контакты {guideName} теперь доступны
          </p>

          {guidePhone ? (
            <p className="text-sm text-muted-foreground">
              Телефон:{" "}
              <a href={`tel:${guidePhone}`} className="font-medium text-foreground hover:underline">
                {guidePhone}
              </a>
            </p>
          ) : null}

          {guideTelegram ? (
            <p className="text-sm text-muted-foreground">
              Telegram:{" "}
              <a
                href={`https://t.me/${guideTelegram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:underline"
              >
                {guideTelegram}
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
