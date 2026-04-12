"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PartnerPayoutsLedgerRow } from "@/lib/supabase/types";

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
});

export type PayoutsLedgerProps = {
  ledger: PartnerPayoutsLedgerRow[];
};

export function PayoutsLedger({ ledger }: PayoutsLedgerProps) {
  const totalMinor = ledger.reduce((acc, row) => acc + row.delta, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-foreground">Начисления</h2>
      <p className="text-sm text-muted-foreground">
        Итого: {money.format(totalMinor / 100)}
      </p>
      {ledger.length === 0 ? (
        <p className="text-sm text-muted-foreground">Начислений пока нет</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>Источник</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString("ru-RU", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {money.format(row.delta / 100)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.ref_id ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
