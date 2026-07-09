import type { OfferStatus } from "@/lib/supabase/types";

export interface OfferMeta {
  id?: string;
  starts_at: string | null;
  capacity: number | null;
  price_minor: number | null;
  message?: string | null;
  status?: OfferStatus;
}
