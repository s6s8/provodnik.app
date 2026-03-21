import Link from "next/link";
import { Compass } from "lucide-react";

const links = [
  { href: "/destinations", label: "Направления", active: true },
  { href: "/requests", label: "Запросы", active: false },
  { href: "/guides/maria-rostov", label: "Гиды", active: false },
  { href: "/listings", label: "Экскурсии", active: false },
  { href: "/auth", label: "Профиль", active: false },
] as const;

export function HomeNav() {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 flex w-full items-center justify-between border-b border-white/50 bg-white/60 px-12 py-4 backdrop-blur-xl"
      aria-label="Главная навигация"
    >
      <Link href="/" className="flex items-center gap-2">
        <Compass className="size-5 shrink-0 text-[#0F766E]" aria-hidden />
        <span className="font-sans text-lg font-semibold text-[#0F172A]">Provodnik</span>
      </Link>
      <div className="flex items-center gap-8">
        {links.map(({ href, label, active }) => (
          <Link
            key={href}
            href={href}
            className={`border-b-2 pb-0.5 font-sans text-[15px] font-medium transition-colors ${
              active
                ? "border-[#0F766E] text-[#0F766E]"
                : "border-transparent text-[#475569] hover:text-[#0F766E]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
