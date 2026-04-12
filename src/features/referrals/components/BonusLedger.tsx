"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BonusLedgerRow } from "@/lib/supabase/types";

const REASON_LABELS: Record<string, string> = {
  referral_redeemed: "Использован реферальный код",
  referral_used: "Ваш код использован",
};

export type BonusLedgerProps = {
  ledger: BonusLedgerRow[];
};

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function BonusLedger({ ledger }: BonusLedgerProps) {
  const balance = ledger.reduce((sum, row) => sum + row.delta, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>Бонусный счёт</CardTitle>
        <Badge variant="secondary" className="text-base font-semibold tabular-nums">
          {balance} бонусов
        </Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="text-right">Бонусы</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Пока нет операций
                </TableCell>
              </TableRow>
            ) : (
              ledger.map((row) => {
                const label =
                  (row.reason && REASON_LABELS[row.reason]) ?? row.reason ?? "—";
                const positive = row.delta > 0;
                return (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </TableCell>
                    <TableCell>{label}</TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${
                        positive ? "text-green-600" : row.delta < 0 ? "text-destructive" : ""
                      }`}
                    >
                      {positive ? `+${row.delta}` : String(row.delta)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
