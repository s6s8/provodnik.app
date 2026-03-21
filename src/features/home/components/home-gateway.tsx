import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";

/** Working Unsplash portrait crops (verified ids) — 18px circles in layout, 2× source for clarity. */
const AVA1 =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80&facepad=2";
const AVA2 =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80&facepad=2";
const AVA3 =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80&facepad=2";

const KAMCHATKA =
  "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?auto=format&fit=crop&w=400&h=200&q=80";
const ALTAI =
  "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=400&h=200&q=80";

function MiniRequestCard({
  badge,
  avatarOrder,
}: {
  badge?: "Новинка";
  avatarOrder: readonly [string, string, string];
}) {
  return (
    <div className="relative min-w-[130px] flex-1 rounded-[14px] border border-[#E2E8F0] bg-white/80 p-3">
      {badge ? (
        <span className="absolute right-2 top-2 rounded-full bg-[#D97706] px-2 py-0.5 font-sans text-[10px] font-semibold text-white">
          {badge}
        </span>
      ) : null}
      <div className="flex items-start gap-1">
        <Users className="size-4 shrink-0 text-[#475569]" aria-hidden />
        <div className="min-w-0">
          <p className="font-sans text-[13px] font-semibold text-[#0F172A]">Байкал</p>
          <p className="mt-1 flex items-center gap-1 font-sans text-[11px] text-[#475569]">
            <CalendarDays className="size-3 shrink-0" aria-hidden />
            4-6 чел.
          </p>
          <p className="mt-0.5 font-sans text-[11px] text-[#475569]">₽ 35-50 тыс. Р</p>
        </div>
      </div>
      <div className="mt-3 flex pl-0.5">
        {avatarOrder.map((src, i) => (
          <span
            key={`${src}-${i}`}
            className={`relative inline-block size-[18px] overflow-hidden rounded-full border-2 border-white bg-[#E2E8F0] shadow-sm ${i > 0 ? "-ml-[6px]" : ""}`}
          >
            <Image
              src={src}
              alt=""
              width={36}
              height={36}
              className="size-full object-cover"
              sizes="18px"
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function MiniListingCard({
  title,
  photo,
  badge,
  className,
}: {
  title: string;
  photo: string;
  badge: string;
  className?: string;
}) {
  return (
    <div
      className={`relative min-w-[130px] shrink-0 basis-[36%] overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white/80 ${className ?? ""}`}
    >
      <div className="relative h-20 w-full overflow-hidden">
        <Image src={photo} alt="" fill className="object-cover" sizes="200px" />
        <span className="absolute left-2 top-2 rounded-full bg-[#D97706] px-2 py-0.5 font-sans text-[10px] font-semibold text-white">
          {badge}
        </span>
      </div>
      <div className="space-y-1 p-2">
        <p className="font-sans text-xs font-semibold text-[#0F172A]">{title}</p>
        <p className="font-sans text-[11px] text-[#475569]">⭐ 4.9/5</p>
        <div className="flex items-center gap-2">
          <span className="relative size-5 shrink-0 overflow-hidden rounded-full bg-[#E2E8F0]">
            <Image src={AVA2} alt="" width={40} height={40} className="size-full object-cover" sizes="20px" />
          </span>
          <span className="font-sans text-[11px] text-[#0F172A]">от 15 000 Р</span>
        </div>
      </div>
    </div>
  );
}

export function HomeGateway() {
  return (
    <section className="relative z-20 -mt-10 bg-[#F9F8F7] px-12 pb-4">
      <div className="mx-auto grid max-w-[1100px] grid-cols-2 gap-5">
        <div className="rounded-[28px] border border-white/60 bg-white/75 p-7 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <h2 className="font-sans text-xl font-semibold text-[#0F172A]">Биржа запросов</h2>
          <p className="mb-5 mt-2 font-sans text-[13px] leading-snug text-[#475569]">
            Соберите группу по датам и бюджету, получайте отклики гидов
            <br />
            и договаривайтесь напрямую с местными проводниками.
          </p>
          <div className="mb-5 flex flex-wrap gap-2.5">
            <Link
              href="/requests/new"
              className="inline-flex rounded-full bg-[#0F766E] px-5 py-2.5 font-sans text-[13px] font-semibold text-white"
            >
              Создать запрос
            </Link>
            <Link
              href="/requests"
              className="inline-flex rounded-full border border-[#CBD5E1] bg-white/70 px-5 py-2.5 font-sans text-[13px] font-medium text-[#0F172A] backdrop-blur-xl"
            >
              Найти группу
            </Link>
          </div>
          <div className="flex gap-2.5">
            <MiniRequestCard avatarOrder={[AVA1, AVA2, AVA3]} />
            <MiniRequestCard avatarOrder={[AVA2, AVA3, AVA1]} />
            <MiniRequestCard badge="Новинка" avatarOrder={[AVA3, AVA1, AVA2]} />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/60 bg-white/75 p-7 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <h2 className="font-sans text-xl font-semibold text-[#0F172A]">Готовые предложения</h2>
          <p className="mb-5 mt-2 font-sans text-[13px] leading-snug text-[#475569]">
            Листайте каталог туров с программой и ценой
            <br />
            или отфильтруйте предложения по направлениям.
          </p>
          <div className="mb-5 flex flex-wrap gap-2.5">
            <Link
              href="/listings"
              className="inline-flex rounded-full bg-[#0F766E] px-5 py-2.5 font-sans text-[13px] font-semibold text-white"
            >
              Смотреть каталог
            </Link>
            <Link
              href="/destinations"
              className="inline-flex rounded-full border border-[#CBD5E1] bg-white/70 px-5 py-2.5 font-sans text-[13px] font-medium text-[#0F172A] backdrop-blur-xl"
            >
              По направлениям
            </Link>
          </div>
          <div className="overflow-hidden rounded-[14px]">
            <div className="flex gap-2.5">
              <MiniListingCard title="Камчатка" photo={KAMCHATKA} badge="Новинка" />
              <MiniListingCard title="Алтай" photo={ALTAI} badge="Хит" />
              <MiniListingCard title="Алтай" photo={ALTAI} badge="Хит" className="opacity-95" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
