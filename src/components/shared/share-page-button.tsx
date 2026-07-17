"use client";

import * as React from "react";
import { Share2 } from "lucide-react";

const LABEL = "Поделиться страницей";
const COPIED = "Ссылка скопирована";

/**
 * Share the current page: the device's own share sheet where there is one
 * (Android/iOS/Safari), a copied link everywhere else.
 *
 * Deliberately not a social link. The footer's brand glyphs are decorative by an
 * accepted-package constraint, and the project has no social accounts to point at —
 * inventing profile URLs would be fake content. This shares the page the visitor is
 * actually on, which is what was asked for.
 *
 * Feedback is a label swap because there is no toast system in the app (same
 * pattern as SupportSidebar's copy button).
 */
export function SharePageButton({ className }: { className?: string }) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function handleShare() {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: document.title, url });
      } catch {
        // Dismissing the sheet throws AbortError. The visitor made a choice —
        // copying instead would override it.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard can be blocked (permissions, insecure origin). Say nothing
      // rather than claim a copy that did not happen.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      aria-label={LABEL}
      className={className}
    >
      <Share2 className="size-4 shrink-0" aria-hidden="true" />
      <span aria-live="polite">{copied ? COPIED : LABEL}</span>
    </button>
  );
}
