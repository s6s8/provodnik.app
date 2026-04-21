import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { GuideOfferRow } from "@/lib/supabase/types";
import type { QaThread } from "@/lib/supabase/qa-threads";

import { AcceptOfferButton } from "./accept-offer-button";
import { OfferQaSheet } from "./offer-qa-sheet";

interface GuideInfo {
  guide_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Props {
  offer: GuideOfferRow;
  guideInfo: GuideInfo | null;
  qaThread: QaThread | null;
  requestId: string;
  requestStatus: string;
  onSendQa: (threadId: string, body: string) => Promise<void>;
  onGetOrCreateQaThread: (offerId: string) => Promise<string>;
}

function formatPrice(minor: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function OfferCard({
  offer,
  guideInfo,
  qaThread,
  requestId,
  requestStatus,
  onSendQa,
  onGetOrCreateQaThread,
}: Props) {
  const guideName = guideInfo?.full_name ?? "Гид";
  const canAccept = requestStatus === "open" && offer.status === "pending";

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      {/* Guide header */}
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={guideInfo?.avatar_url ?? undefined}
            alt={guideName}
          />
          <AvatarFallback>{guideName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{guideName}</p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(offer.price_minor, offer.currency)}
            {offer.capacity > 1 ? ` · до ${offer.capacity} чел.` : ""}
          </p>
        </div>
        <Badge variant={offer.status === "accepted" ? "default" : "outline"}>
          {offer.status === "accepted" ? "Принято" : "Ожидает"}
        </Badge>
      </div>

      {/* PII disclosure banner */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-xs text-amber-700">
          Контактные данные скрыты до принятия предложения
        </p>
      </div>

      {/* Offer message (already masked by getOffersForRequest) */}
      {offer.message ? (
        <div className="rounded-lg border bg-background/60 p-3">
          <p className="mb-1 text-xs text-muted-foreground">Сообщение гида</p>
          <p className="text-sm">{offer.message}</p>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canAccept ? (
          <AcceptOfferButton
            offerId={offer.id}
            requestId={requestId}
            guideId={offer.guide_id}
            priceMinor={offer.price_minor}
          />
        ) : null}

        <OfferQaSheet
          offerId={offer.id}
          initialThread={qaThread}
          onSend={onSendQa}
          onGetOrCreate={onGetOrCreateQaThread}
        />
      </div>
    </div>
  );
}
