import { formatRubNumber } from "@/data/money";

type MoneyBreakdownProps = {
  pricePerPerson: number;
  partySize: number;
  depositMinor?: number;
  remainderMinor?: number;
  platformFeeMinor?: number;
  cancellationPolicy?: string;
  currency?: string;
};

/** Honest money rows — null rows omitted, face-to-face payment note always shown. Server-safe. */
export function MoneyBreakdown({
  pricePerPerson,
  partySize,
  depositMinor,
  remainderMinor,
  platformFeeMinor,
  cancellationPolicy,
  currency,
}: MoneyBreakdownProps) {
  const fmt = (n: number) => `${formatRubNumber(n)} ${currency ?? "₽"}`;

  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <span className="text-muted-foreground">Итого</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {pricePerPerson} × {partySize}
          </span>
        </div>
        <span className="font-extrabold text-on-surface">{fmt(pricePerPerson * partySize)}</span>
      </div>

      {depositMinor != null ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Депозит</span>
          <span className="text-on-surface">{fmt(depositMinor / 100)}</span>
        </div>
      ) : null}

      {remainderMinor != null ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Остаток</span>
          <span className="text-on-surface">{fmt(remainderMinor / 100)}</span>
        </div>
      ) : null}

      {platformFeeMinor != null ? (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Сервисный сбор</span>
          <span className="text-on-surface">{fmt(platformFeeMinor / 100)}</span>
        </div>
      ) : null}

      {cancellationPolicy ? (
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-on-surface">Условия отмены</span>
          <p className="mt-0.5">{cancellationPolicy}</p>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Оплата напрямую гиду при встрече. Проводник не обрабатывает оплату.
      </p>
    </div>
  );
}
