"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useState,
  useTransition,
  type ComponentProps,
} from "react";

import {
  acceptOffer,
  counterOffer,
  declineOffer,
} from "@/features/messaging/actions/offerActions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { GuideOfferRow } from "@/lib/supabase/types";

export type OfferCardProps = {
  offerId: string;
  priceMinor: number;
  currency: string;
  description: string | null;
  status: GuideOfferRow["status"];
  validUntil: string | null;
  viewerRole: "traveler" | "guide";
};

function statusBadgeVariant(
  status: GuideOfferRow["status"],
): ComponentProps<typeof Badge>["variant"] {
  switch (status) {
    case "pending":
      return "secondary";
    case "accepted":
      return "default";
    case "declined":
      return "destructive";
    case "counter_offered":
      return "outline";
    case "expired":
      return "outline";
    case "withdrawn":
      return "outline";
    default:
      return "outline";
  }
}

function statusLabel(status: GuideOfferRow["status"]): string {
  switch (status) {
    case "pending":
      return "Ожидает ответа";
    case "accepted":
      return "Принято";
    case "declined":
      return "Отклонено";
    case "counter_offered":
      return "Оспорено";
    case "expired":
      return "Истёк срок";
    case "withdrawn":
      return "Отозвано";
    default:
      return String(status);
  }
}

function formatValidUntil(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OfferCard({
  offerId,
  priceMinor,
  currency,
  description,
  status,
  validUntil,
  viewerRole,
}: OfferCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPriceRub, setCounterPriceRub] = useState("");
  const [counterDescription, setCounterDescription] = useState("");

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["thread-messages"] });
    router.refresh();
  }, [queryClient, router]);

  const showActions = status === "pending" && viewerRole === "traveler";

  const handleAccept = () => {
    startTransition(() => {
      void (async () => {
        await acceptOffer(offerId);
        refresh();
      })();
    });
  };

  const handleDecline = () => {
    startTransition(() => {
      void (async () => {
        await declineOffer(offerId);
        refresh();
      })();
    });
  };

  const handleCounterSubmit = () => {
    const rub = Number.parseInt(counterPriceRub, 10);
    if (Number.isNaN(rub) || rub < 0) return;
    const newPriceMinor = Math.round(rub * 100);
    startTransition(() => {
      void (async () => {
        await counterOffer(offerId, newPriceMinor, counterDescription);
        setCounterOpen(false);
        setCounterPriceRub("");
        setCounterDescription("");
        refresh();
      })();
    });
  };

  return (
    <Card size="sm" className="w-full max-w-[min(100%,38rem)]">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle>Предложение гида</CardTitle>
          <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-4">
        <p className="text-3xl font-bold tracking-tight text-foreground">
          {Math.round(priceMinor / 100)} {currency === "RUB" ? "₽" : currency}
        </p>
        {description ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {validUntil ? (
          <p className="text-sm text-muted-foreground">
            Действительно до: {formatValidUntil(validUntil)}
          </p>
        ) : null}

        {showActions ? (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={isPending}
                onClick={handleAccept}
              >
                Принять
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleDecline}
              >
                Отклонить
              </Button>
            </div>
            <div className="grid gap-3">
              <Button
                type="button"
                variant="ghost"
                className="justify-self-start px-0 text-primary hover:bg-transparent"
                onClick={() => setCounterOpen((o) => !o)}
              >
                Встречное предложение
              </Button>
              {counterOpen ? (
                <div className="grid gap-3 rounded-glass border border-glass-border bg-glass/40 p-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`counter-price-${offerId}`}>Цена (₽)</Label>
                    <Input
                      id={`counter-price-${offerId}`}
                      inputMode="numeric"
                      type="number"
                      min={0}
                      value={counterPriceRub}
                      onChange={(e) => setCounterPriceRub(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`counter-desc-${offerId}`}>Описание</Label>
                    <Textarea
                      id={`counter-desc-${offerId}`}
                      rows={3}
                      value={counterDescription}
                      onChange={(e) => setCounterDescription(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={isPending}
                    onClick={handleCounterSubmit}
                  >
                    Отправить
                  </Button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
