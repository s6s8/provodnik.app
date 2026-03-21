import Link from "next/link";

function VkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.491 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.135.813-.542 1.253-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.203.966-2.18 3.793-2.18 3.793-.186.305-.254.44 0 .78.186.254.796.779 1.202 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.496.438-.854.998-.854.565 0 .948.375 1.02.916.07.635-.064 1.378-.19 1.948-.317 1.47-1.687 6.24-2.39 8.32-.297.896-.88 1.195-1.437 1.22-.75.035-1.32-.495-2.05-.97-1.14-.755-1.785-1.225-2.89-1.965-1.28-.855-.45-1.325.28-2.09.19-.2 3.95-3.62 4.02-3.93.01-.04.02-.19-.07-.28-.09-.09-.22-.06-.32-.04-.13.03-2.2 1.4-6.21 4.11-.59.4-1.12.595-1.6.585-.53-.01-1.55-.295-2.31-.54-.93-.305-1.67-.47-1.6-.99.035-.27.405-.545 1.11-.895 4.35-1.89 7.25-3.13 8.7-3.73 4.15-1.73 5.01-2.03 5.57-2.04z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function HomeFooter() {
  return (
    <footer className="border-t border-[#E2E8F0] bg-[#F9F8F7] px-12 pb-8 pt-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-4 gap-8">
          <div>
            <p className="mb-3 font-sans text-[13px] font-semibold text-[#0F172A]">О нас</p>
            <p className="font-sans text-xs leading-relaxed text-[#94A3B8]">
              Provodnik соединяет путешественников с местными гидами: прозрачные условия,
              <br />
              живые маршруты и бронирование без лишнего шума.
            </p>
          </div>
          <div>
            <p className="mb-3 font-sans text-[13px] font-semibold text-[#0F172A]">Помощь</p>
            <ul className="space-y-2 font-sans text-xs text-[#475569]">
              <li>
                <Link href="/trust" className="transition-colors hover:text-[#0F766E]">
                  Центр поддержки
                </Link>
              </li>
              <li>
                <Link href="/trust" className="transition-colors hover:text-[#0F766E]">
                  Частые вопросы
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="transition-colors hover:text-[#0F766E]">
                  Направления
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-sans text-[13px] font-semibold text-[#0F172A]">Правила</p>
            <ul className="space-y-2 font-sans text-xs text-[#475569]">
              <li>
                <Link href="/trust" className="transition-colors hover:text-[#0F766E]">
                  Связаться с нами
                </Link>
              </li>
              <li>
                <Link href="/policies/refunds" className="transition-colors hover:text-[#0F766E]">
                  Условия возврата
                </Link>
              </li>
              <li>
                <Link href="/policies/cancellation" className="transition-colors hover:text-[#0F766E]">
                  Политика конфиденциальности
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex justify-end">
            <div className="flex gap-2">
              <a
                href="https://vk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#475569] transition-colors hover:text-[#0F766E]"
                aria-label="ВКонтакте"
              >
                <VkIcon className="size-4" />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#475569] transition-colors hover:text-[#0F766E]"
                aria-label="Telegram"
              >
                <TelegramIcon className="size-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex size-9 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#475569] transition-colors hover:text-[#0F766E]"
                aria-label="Instagram"
              >
                <InstagramIcon className="size-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-4 border-t border-[#E2E8F0] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-sans text-xs text-[#94A3B8]">© 2024 Provodnik. Все права защищены.</p>
          <div className="flex flex-wrap gap-6 font-sans text-xs text-[#94A3B8]">
            <Link href="/trust" className="transition-colors hover:text-[#475569]">
              Условия использования
            </Link>
            <Link href="/trust" className="transition-colors hover:text-[#475569]">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
