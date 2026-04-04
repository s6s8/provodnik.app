import Link from "next/link";

import { getGuideReviewQueue } from "@/lib/supabase/moderation";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function verificationBadgeClass(status: string) {
  switch (status) {
    case "approved":
      return "booking-badge booking-badge--completed";
    case "rejected":
      return "booking-badge booking-badge--cancelled";
    case "submitted":
      return "booking-badge booking-badge--pending";
    default:
      return "booking-badge booking-badge--pending";
  }
}

function verificationLabel(status: string) {
  switch (status) {
    case "approved":
      return "Одобрен";
    case "rejected":
      return "Отклонен";
    case "submitted":
      return "На проверке";
    default:
      return "Черновик";
  }
}

export default async function AdminGuidesPage() {
  const guides = await getGuideReviewQueue();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Проверка гидов
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Сначала показаны анкеты со статусом «submitted», затем все остальные
          профили для повторной проверки и истории решений.
        </p>
      </div>

      <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-[var(--card-shadow)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border/70 text-sm">
            <thead className="bg-[var(--surface-low)] text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Гид</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Регионы</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Отправлено</th>
                <th className="px-4 py-3 font-medium">Детали</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {guides.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    Нет анкет для проверки.
                  </td>
                </tr>
              ) : null}

              {guides.map((item) => {
                const displayName =
                  item.profile.display_name ||
                  item.account?.full_name ||
                  item.account?.email ||
                  "Без имени";

                return (
                  <tr key={item.profile.user_id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{displayName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {item.profile.languages.join(", ") || "Языки не указаны"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.account?.email ?? "—"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {item.profile.regions.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={verificationBadgeClass(
                          item.profile.verification_status,
                        )}
                      >
                        {verificationLabel(item.profile.verification_status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatDateTime(item.profile.updated_at)}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/guides/${item.profile.user_id}`}
                        className="text-sm font-medium text-[var(--primary)]"
                      >
                        Просмотреть
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
