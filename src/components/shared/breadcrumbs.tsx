import Link from "next/link";

type BreadcrumbsNavProps = {
  pathname: string;
};

const SEGMENT_LABELS: Record<string, string | null> = {
  "": null,
  traveler: "Путешественник",
  guide: "Гид",
  admin: "Оператор",
  messages: "Сообщения",
  notifications: "Уведомления",
  dashboard: "Кабинет",
  requests: "Запросы",
  bookings: "Бронирования",
  favorites: "Избранное",
  listings: "Туры",
  new: "Создать",
  edit: "Редактировать",
  verification: "Верификация",
  settings: "Настройки",
  disputes: "Споры",
  guides: "Гиды",
  "open-requests": "Открытые запросы",
  offer: "Предложение",
  review: "Отзыв",
  dispute: "Спор",
};

const DYNAMIC_SEGMENT_PATTERN = /^[0-9a-f-]{8,}$/i;

export function BreadcrumbsNav({ pathname }: BreadcrumbsNavProps) {
  const segments = pathname.split("/").filter(Boolean);
  const items = segments.reduce<Array<{ label: string; href: string }>>(
    (acc, segment, index) => {
      const label = DYNAMIC_SEGMENT_PATTERN.test(segment)
        ? null
        : SEGMENT_LABELS[segment] ?? segment;

      if (label === null) {
        return acc;
      }

      acc.push({
        label,
        href: `/${segments.slice(0, index + 1).join("/")}`,
      });

      return acc;
    },
    []
  );

  if (items.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
    >
      {items.map((item, index) =>
        index < items.length - 1 ? (
          <span key={item.href} className="flex items-center gap-1.5">
            <Link
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
            <span aria-hidden>/</span>
          </span>
        ) : (
          <span key={item.href} className="font-medium text-foreground">
            {item.label}
          </span>
        )
      )}
    </nav>
  );
}
