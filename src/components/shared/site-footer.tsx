import Link from "next/link";

import { SharePageButton } from "@/components/shared/share-page-button";
import { flags } from "@/lib/flags";
import {
  filterNavItemsByHiddenHrefs,
  footerNav,
  hiddenNavHrefsForFlags,
  type NavItem,
} from "@/lib/navigation";

const TG_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.93.43l-2.6-1.91-1.25 1.21c-.14.14-.26.26-.53.26l.19-2.66 4.84-4.37c.21-.19-.05-.29-.32-.1L7.97 14.37l-2.55-.8c-.55-.17-.56-.55.12-.82l9.95-3.84c.46-.17.86.11.15.89z" />
  </svg>
);

// Decorative brand glyphs only. The accepted package requires these bottom icons
// to be visual-only and non-interactive (no external social navigation, share, or
// click handler); the Telegram support channel lives in the «Поддержка» nav above.
const socialIcons = [{ label: "Telegram", icon: TG_ICON }] as const;

export function SiteFooter() {
  const hiddenHrefs = hiddenNavHrefsForFlags((flag) => flags[flag]);
  const supportLinks = filterNavItemsByHiddenHrefs(footerNav.support, hiddenHrefs);

  return (
    <footer className="bg-footer-bg pb-8 pt-14" role="contentinfo">
      <div className="mx-auto max-w-page px-[clamp(20px,4vw,48px)]">
        <div className="mb-7 grid grid-cols-1 gap-7 pb-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          <nav aria-label="О проекте">
            <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
              О проекте
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {footerNav.about.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="flex min-h-11 items-center text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground md:min-h-0">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Поддержка">
            <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
              Поддержка
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {supportLinks.map((link: NavItem) =>
                link.external ? (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 items-center text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground md:min-h-0"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.label}>
                    <Link href={link.href} className="flex min-h-11 items-center text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground md:min-h-0">
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-primary-foreground/60">
              Отвечаем ежедневно, обычно в течение нескольких часов (с 9:00 до 22:00 МСК).
            </p>
          </nav>

          <div>
            <nav aria-label="Правила">
              <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                Правила
              </p>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {footerNav.legal.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="flex min-h-11 items-center text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground md:min-h-0">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6">
              <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                Мы в сети
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                {socialIcons.map((social) => (
                  <span
                    key={social.label}
                    role="img"
                    aria-label={social.label}
                    className="flex size-11 items-center justify-center rounded-full border border-primary-foreground/15 text-primary-foreground/55"
                  >
                    {social.icon}
                  </span>
                ))}
                {/* Beside the decorative glyphs, never on them: they must stay
                    non-interactive per the accepted package. */}
                <SharePageButton className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary-foreground/15 px-4 text-[0.8125rem] text-primary-foreground/60 transition-colors hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-7">
          <p className="text-[0.8125rem] leading-relaxed text-primary-foreground/55">
            <span className="font-medium text-primary-foreground/75">Оператор персональных данных:</span>{" "}
            команда проекта Проводник. Контакт по вопросам обработки данных и
            юридическим уведомлениям —{" "}
            <a
              href="mailto:support@provodnik.app"
              className="underline underline-offset-4 transition-colors hover:text-primary-foreground"
            >
              support@provodnik.app
            </a>
            . Проводник находится на стадии запуска; полные
            регистрационные сведения оператора (ОГРНИП/ОГРН, ИНН,
            юридический адрес) публикуются{" "}
            <Link
              href="/policies/privacy#operator"
              className="underline underline-offset-4 transition-colors hover:text-primary-foreground"
            >
              на странице «Конфиденциальность»
            </Link>{" "}
            и обновляются до запуска приёма платежей на платформе.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-primary-foreground/10 pt-4 max-md:flex-col max-md:items-start">
          <p className="text-xs text-primary-foreground/70">© 2026 Проводник. Все права защищены.</p>
          <a
            href="mailto:support@provodnik.app"
            className="inline-flex min-h-11 items-center text-[0.8125rem] text-primary-foreground/60 underline underline-offset-4 transition-colors hover:text-primary-foreground/85 md:min-h-0"
          >
            Поддержка
          </a>
        </div>
      </div>
    </footer>
  );
}
