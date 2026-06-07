import Link from "next/link";
import { ChevronDown } from "lucide-react";

const TG_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.93.43l-2.6-1.91-1.25 1.21c-.14.14-.26.26-.53.26l.19-2.66 4.84-4.37c.21-.19-.05-.29-.32-.1L7.97 14.37l-2.55-.8c-.55-.17-.56-.55.12-.82l9.95-3.84c.46-.17.86.11.15.89z" />
  </svg>
);

const projectLinks = [
  { href: "/trust", label: "О нас" },
  { href: "/how-it-works", label: "Как это работает" },
  { href: "/guides", label: "Для гидов" },
  { href: "/for-business", label: "Для бизнеса" },
] as const;

const supportLinks = [
  { href: "/trust", label: "Доверие и безопасность" },
  { href: "https://t.me/provodnik_help", label: "Telegram-поддержка", external: true },
  { href: "mailto:support@provodnik.app", label: "Email: support@provodnik.app" },
] as const;

const policyLinks = [
  { href: "/policies/terms", label: "Условия использования" },
  { href: "/policies/privacy", label: "Конфиденциальность" },
  { href: "/policies/cookies", label: "Cookies" },
] as const;

const socialLinks = [
  { href: "https://t.me/provodnik_help", label: "Telegram", icon: TG_ICON },
] as const;

const faqItems = [
  {
    q: "Могу ли я присоединиться к чужой группе?",
    a: "Да. Выберите тип Сборная группа при создании запроса — или загляните в центр запросов и присоединяйтесь к чужому, если он подходит по датам и интересам.",
  },
  {
    q: "Как долго ждать предложения?",
    a: "Зависит от направления и сезона. Активные гиды обычно откликаются в течение нескольких часов или дня.",
  },
  {
    q: "Что если гид не ответит?",
    a: "Вы видите все предложения вместе — можно выбрать любое или отменить запрос в любой момент. Обязательств до принятия предложения нет.",
  },
  {
    q: "Можно ли оплатить как юрлицо: счёт, договор, безналичная оплата, акт?",
    a: "Корпоративные заявки оформляем индивидуально через поддержку: счёт на юрлицо, договор, безналичная оплата с расчётного счёта и закрывающие документы (акт, УПД) выставляет гид напрямую. Подробности — на странице «Для бизнеса» или напишите на support@provodnik.app с темой «Корпоративная заявка».",
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-footer-bg pb-8 pt-14" role="contentinfo">
      <div className="mx-auto max-w-page px-[clamp(20px,4vw,48px)]">
        <section aria-label="Частые вопросы" className="mb-10 border-b border-primary-foreground/10 pb-10">
          <p className="mb-5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
            Частые вопросы
          </p>
          <div className="flex flex-col gap-2">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-md border border-primary-foreground/10 bg-primary-foreground/[0.02] px-4 py-3 transition-colors hover:bg-primary-foreground/[0.04]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-primary-foreground/80 [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-primary-foreground/40 transition-transform duration-150 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-primary-foreground/60">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mb-7 grid grid-cols-1 gap-7 pb-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          <nav aria-label="О проекте">
            <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
              О проекте
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {projectLinks.map((link) => (
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
              {supportLinks.map((link) =>
                "external" in link && link.external ? (
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
            <p className="mt-3 text-xs leading-relaxed text-primary-foreground/45">
              Отвечаем ежедневно, обычно в течение нескольких часов (с 9:00 до 22:00 МСК).
            </p>
          </nav>

          <div>
            <nav aria-label="Правила">
              <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">
                Правила
              </p>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {policyLinks.map((link) => (
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
              <div className="mt-1.5 flex gap-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex size-11 items-center justify-center rounded-full border border-primary-foreground/15 text-primary-foreground/55 transition-[border-color,color] duration-150 hover:border-primary-foreground/40 hover:text-primary-foreground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 pt-7">
          <p className="text-[0.8125rem] leading-relaxed text-primary-foreground/55">
            <span className="font-medium text-primary-foreground/75">Оператор персональных данных:</span>{" "}
            команда проекта Provodnik. Контакт по вопросам обработки данных и
            юридическим уведомлениям —{" "}
            <a
              href="mailto:support@provodnik.app"
              className="underline underline-offset-4 transition-colors hover:text-primary-foreground"
            >
              support@provodnik.app
            </a>
            . Provodnik находится на стадии запуска; полные
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

        <div className="mt-6 flex items-center justify-between gap-3 max-md:flex-col max-md:items-start">
          <p className="text-[0.8125rem] text-primary-foreground/35">© 2026 Provodnik. Все права защищены.</p>
          <a
            href="mailto:support@provodnik.app"
            className="inline-flex min-h-11 items-center text-[0.8125rem] text-primary-foreground/35 transition-colors hover:text-primary-foreground/70 md:min-h-0"
          >
            Поддержка
          </a>
        </div>
      </div>
    </footer>
  );
}
