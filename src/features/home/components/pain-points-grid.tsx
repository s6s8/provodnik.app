import { Camera, Castle, Snowflake, UtensilsCrossed } from "lucide-react";

const categories = [
  {
    title: "Гастрономия",
    description: "Рынки, локальные кухни, винодельни и понятный темп без перегруза.",
    icon: UtensilsCrossed,
  },
  {
    title: "История и города",
    description: "Прогулки по центру, крепости, музеи и маршруты на день.",
    icon: Castle,
  },
  {
    title: "Природа и сезон",
    description: "Байкал, ледовые маршруты, побережье и выезды под погоду.",
    icon: Snowflake,
  },
  {
    title: "Фотопоездки",
    description: "Свет, точки съемки и паузы для фото уже заложены в маршрут.",
    icon: Camera,
  },
] as const;

export function PainPointsGrid() {
  return (
    <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      <div className="space-y-4">
        <p className="editorial-kicker">Популярные форматы</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Не каталог ради каталога, а понятные сценарии поездки.
        </h2>
        <p className="max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">
          На витрине сразу видно длительность, размер группы и ожидания по темпу.
          Поэтому пользователю проще выбрать экскурсию, а не читать длинное
          описание и гадать, подойдет ли она семье, паре или друзьям.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="section-frame rounded-[1.8rem] p-5 sm:p-6"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
