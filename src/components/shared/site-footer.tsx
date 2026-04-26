import Link from "next/link";
import { ChevronDown } from "lucide-react";

const VK_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14C20.67 22 22 20.67 22 15.07V8.93C22 3.33 20.67 2 15.07 2zm3.08 13.87h-1.62c-.61 0-.8-.49-1.9-1.6-.95-.93-1.37-.93-1.6-.93-.33 0-.42.09-.42.56v1.46c0 .4-.13.64-1.18.64-1.74 0-3.67-1.06-5.02-3.03C4.7 10.3 4.27 8.45 4.27 8.06c0-.23.09-.45.56-.45h1.62c.42 0 .58.19.74.64.82 2.36 2.19 4.43 2.75 4.43.21 0 .3-.1.3-.64V9.81c-.07-1.15-.67-1.24-.67-1.65 0-.19.15-.39.4-.39h2.55c.35 0 .47.19.47.6v3.23c0 .35.15.47.26.47.21 0 .38-.12.77-.51 1.19-1.33 2.04-3.38 2.04-3.38.11-.23.3-.45.73-.45h1.62c.49 0 .6.25.49.6-.21 1-.2.97-1.55 2.94-.23.37-.32.54 0 .93.23.28.98.93 1.48 1.49.92 1.04 1.62 1.91 1.81 2.51.2.59-.1.89-.7.89z" />
  </svg>
);

const TG_ICON = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.93.43l-2.6-1.91-1.25 1.21c-.14.14-.26.26-.53.26l.19-2.66 4.84-4.37c.21-.19-.05-.29-.32-.1L7.97 14.37l-2.55-.8c-.55-.17-.56-.55.12-.82l9.95-3.84c.46-.17.86.11.15.89z" />
  </svg>
);

const projectLinks = [
  { href: "/trust", label: "О нас" },
  { href: "/guides", label: "Для гидов" },
] as const;

const supportLinks = [
  { href: "/trust", label: "Доверие и безопасность" },
  { href: "mailto:support@provodnik.app", label: "Связаться с нами" },
] as const;

const policyLinks = [
  { href: "/policies/terms", label: "Условия использования" },
  { href: "/policies/privacy", label: "Конфиденциальность" },
  { href: "/policies/cookies", label: "Cookies" },
] as const;

const socialLinks = [
  { href: "https://vk.com", label: "ВКонтакте", icon: VK_ICON },
  { href: "https://t.me", label: "Telegram", icon: TG_ICON },
] as const;

const faqItems = [
  {
    q: "Могу ли я присоединиться к чужой группе?",
    a: "Да. Выберите тип Сборная группа при создании запроса — или загляните в раздел Открытых запросов и присоединяйтесь к чужому, если он подходит по датам и интересам.",
  },
  {
    q: "Как долго ждать предложения?",
    a: "Зависит от направления и сезона. Активные гиды обычно откликаются в течение нескольких часов или дня.",
  },
  {
    q: "Что если гид не ответит?",
    a: "Вы видите все предложения вместе — можно выбрать любое или отменить запрос в любой момент. Обязательств до принятия предложения нет.",
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-footer-bg pb-8 pt-14" role="contentinfo">
      <div className="mx-auto max-w-page px-[clamp(20px,4vw,48px)]">
        <section aria-label="Частые вопросы" className="mb-10 border-b border-white/10 pb-10">
          <p className="mb-5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/[0.68]">
            Частые вопросы
          </p>
          <div className="flex flex-col gap-2">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:bg-white/[0.04]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-white/80 [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-white/40 transition-transform duration-150 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <div className="mb-7 grid grid-cols-1 gap-7 pb-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          <nav aria-label="О проекте">
            <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/[0.68]">
              О проекте
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {projectLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="block text-sm text-white/60 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Поддержка">
            <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/[0.68]">
              Поддержка
            </p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="block text-sm text-white/60 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <nav aria-label="Правила">
              <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/[0.68]">
                Правила
              </p>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {policyLinks.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="block text-sm text-white/60 transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-6">
              <p className="mb-3.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/[0.68]">
                Мы в сети
              </p>
              <div className="mt-1.5 flex gap-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex size-[38px] items-center justify-center rounded-full border border-white/12 text-white/55 transition-[border-color,color] duration-150 hover:border-white/[0.38] hover:text-white"
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

        <div className="flex items-center justify-between gap-3 pt-7 max-md:flex-col max-md:items-start">
          <p className="text-[0.8125rem] text-white/[0.35]">© 2026 Provodnik. Все права защищены.</p>
          <a
            href="mailto:support@provodnik.app"
            className="text-[0.8125rem] text-white/[0.35] transition-colors hover:text-white/70"
          >
            Поддержка
          </a>
        </div>
      </div>
    </footer>
  );
}
