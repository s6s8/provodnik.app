"use client";

import * as React from "react";

interface SupportSidebarProps {
  bookingId: string;
}

export function SupportSidebar({ bookingId }: SupportSidebarProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(bookingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <aside className="rounded-xl border border-border/60 bg-surface-high px-5 py-4 space-y-3 text-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Поддержка
      </p>
      <p className="text-muted-foreground">С 9:00 до 21:00 по Москве</p>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Поездка:</span>
        <code className="font-mono text-xs text-foreground">{bookingId.slice(0, 8).toUpperCase()}</code>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-primary hover:underline"
        >
          {copied ? "Скопировано" : "Скопировать"}
        </button>
      </div>

      <div className="space-y-1.5">
        <a
          href="mailto:support@provodnik.app"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>✉</span>
          <span>support@provodnik.app</span>
        </a>
        <a
          href="https://t.me/provodnik_help"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>✈</span>
          <span>@provodnik_help</span>
        </a>
      </div>
    </aside>
  );
}
