import Link from "next/link";

import {
  homeContainerClass,
  homepageContent,
} from "@/features/homepage/components/homepage-content";
import { cn } from "@/lib/utils";

export function HomePageFooter() {
  const { about, columns, legal, socialLinks } = homepageContent.footer;

  return (
    <footer
      className={cn(
        homeContainerClass,
        "border-t border-[rgba(226,232,240,0.75)] pb-8 pt-6 text-[var(--color-text-muted)]",
      )}
    >
      <div className="grid gap-7 pb-6 md:grid-cols-[1.15fr_1fr_1fr_auto] md:gap-6">
        <div className="space-y-2">
          <h3 className="text-[0.8125rem] font-semibold text-[var(--color-text)]">
            {about.title}
          </h3>
          <div className="space-y-1 text-[0.75rem] leading-relaxed">
            {about.lines.map((line) => (
              <p key={line} className="text-[var(--color-text-secondary)]">
                {line}
              </p>
            ))}
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="space-y-2">
            <h3 className="text-[0.8125rem] font-semibold text-[var(--color-text)]">
              {column.title}
            </h3>
            <div className="space-y-1.5">
              {column.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-[0.8125rem] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-start justify-start gap-2 md:justify-end">
          <SocialLinkButton href={socialLinks[0].href} label={socialLinks[0].label}>
            <VkIcon />
          </SocialLinkButton>
          <SocialLinkButton href={socialLinks[1].href} label={socialLinks[1].label}>
            <TelegramIcon />
          </SocialLinkButton>
          <SocialLinkButton href={socialLinks[2].href} label={socialLinks[2].label}>
            <InstagramIcon />
          </SocialLinkButton>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-[rgba(226,232,240,0.65)] pt-4 text-[0.75rem] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[var(--color-text-muted)]">{legal.copyright}</p>
        <div className="flex flex-wrap items-center gap-4">
          {legal.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

function SocialLinkButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-full border border-[rgba(226,232,240,0.9)] bg-[rgba(255,255,255,0.65)] text-[var(--color-text-secondary)] shadow-[0_4px_12px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-colors hover:text-[var(--color-text)]"
    >
      {children}
    </Link>
  );
}

function VkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true">
      <path d="M3.6 7.2c.13 6.43 3.35 10.31 9 10.31h.34V14.1c1.92.18 3.38 1.6 3.96 3.41h2.72c-.74-2.71-2.68-4.21-3.89-4.79 1.21-.7 2.91-2.39 3.31-5.52h-2.48c-.52 2.54-2.09 4.23-3.62 4.45V7.2h-2.48v7.79c-1.55-.38-3.52-2.19-3.61-7.79H3.6Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true">
      <path d="M21.22 4.31a1.4 1.4 0 0 0-1.49-.17L3.38 11.5a1.18 1.18 0 0 0 .1 2.18l4.14 1.54 1.53 4.55a1.18 1.18 0 0 0 2.12.25l2.38-3.28 4.5 3.3a1.4 1.4 0 0 0 2.21-.84l2.29-13.33a1.4 1.4 0 0 0-.43-1.56ZM9.57 14.27l8.4-7.06-6.79 8.46-.38 1.63-1.23-3.03Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden="true">
      <path d="M7.2 2h9.6A5.2 5.2 0 0 1 22 7.2v9.6a5.2 5.2 0 0 1-5.2 5.2H7.2A5.2 5.2 0 0 1 2 16.8V7.2A5.2 5.2 0 0 1 7.2 2Zm0 1.8A3.4 3.4 0 0 0 3.8 7.2v9.6a3.4 3.4 0 0 0 3.4 3.4h9.6a3.4 3.4 0 0 0 3.4-3.4V7.2a3.4 3.4 0 0 0-3.4-3.4H7.2Zm10.14 1.35a1.01 1.01 0 1 1 0 2.02 1.01 1.01 0 0 1 0-2.02ZM12 6.8A5.2 5.2 0 1 1 6.8 12 5.2 5.2 0 0 1 12 6.8Zm0 1.8A3.4 3.4 0 1 0 15.4 12 3.4 3.4 0 0 0 12 8.6Z" />
    </svg>
  );
}
