import Image from "next/image";
import Link from "next/link";

const BAIKAL =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&h=900&q=80";
const KAZAN =
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&h=500&q=80";
const KALININGRAD =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&h=500&q=80";
const SUZDAL =
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&h=500&q=80";
const MURMANSK =
  "https://images.unsplash.com/photo-1527489377706-5bf97e608852?auto=format&fit=crop&w=800&h=500&q=80";

function SmallDestinationCard({
  photo,
  badge,
  city,
  subtitle,
  tours,
}: {
  photo: string;
  badge: string;
  city: string;
  subtitle: string;
  tours: string;
}) {
  return (
    <div className="relative h-[200px] overflow-hidden rounded-2xl">
      <Image src={photo} alt="" fill className="object-cover" sizes="(max-width: 1200px) 50vw, 25vw" />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/20 to-transparent"
        aria-hidden
      />
      <span className="absolute right-3 top-3 rounded-full bg-[#D97706] px-2.5 py-0.5 font-sans text-[10px] font-semibold text-white">
        {badge}
      </span>
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-2 p-4">
        <div>
          <p className="font-sans text-[15px] font-semibold text-white">{city}</p>
          <p className="font-sans text-xs text-white/75">{subtitle}</p>
        </div>
        <p className="shrink-0 text-right font-sans text-[11px] text-white/80">{tours}</p>
      </div>
    </div>
  );
}

export function HomeDestinations() {
  return (
    <section id="destinations" className="bg-[#F9F8F7] px-12 py-16">
      <div className="mx-auto max-w-[1200px]">
        <h2 className="mb-7 font-sans text-[28px] font-semibold text-[#0F172A]">Популярные направления</h2>
        <div className="grid grid-cols-[1.6fr_1fr_1fr] grid-rows-2 gap-3">
          <div className="relative row-span-2 min-h-[420px] overflow-hidden rounded-3xl">
            <Image
              src={BAIKAL}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1200px) 100vw, 50vw"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[rgba(15,23,42,0.75)] via-transparent to-transparent"
              aria-hidden
            />
            <div className="absolute bottom-6 left-6 right-6">
              <p className="font-serif text-[26px] font-semibold leading-snug text-white">Озеро Байкал</p>
              <p className="mb-4 mt-1.5 font-sans text-xs leading-snug text-white/80">
                Прозрачная вода, тайга и зимний лёд — путешествуйте в небольшой группе
                <br />
                с проверенными местными проводниками.
              </p>
              <Link
                href="/listings"
                className="inline-flex rounded-full bg-[#0F766E] px-5 py-2.5 font-sans text-[13px] font-semibold text-white"
              >
                Смотреть туры
              </Link>
            </div>
          </div>

          <SmallDestinationCard
            photo={KAZAN}
            badge="Новинка"
            city="Казань"
            subtitle="Кремль"
            tours="14 туров"
          />
          <SmallDestinationCard
            photo={KALININGRAD}
            badge="Хит"
            city="Калининград"
            subtitle="Янтарный музей"
            tours="20 туров"
          />
          <SmallDestinationCard
            photo={SUZDAL}
            badge="Новинка"
            city="Суздаль"
            subtitle="Древняя архитектура"
            tours="16 туров"
          />
          <SmallDestinationCard
            photo={MURMANSK}
            badge="Новинка"
            city="Мурманск"
            subtitle="Северное сияние"
            tours="19 туров"
          />
        </div>
      </div>
    </section>
  );
}
