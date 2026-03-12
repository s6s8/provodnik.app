export type Uuid = string;

export type OfferStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "withdrawn";

export type BookingStatus =
  | "pending"
  | "awaiting_guide_confirmation"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "disputed"
  | "no_show";

export type NotificationKindDb =
  | "new_offer"
  | "offer_expiring"
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "dispute_opened"
  | "review_requested"
  | "admin_alert";

export type ThreadSubject = "request" | "offer" | "booking" | "dispute";

export type MessageSenderRole = "traveler" | "guide" | "admin" | "system";

export type EventScope = "request" | "booking" | "dispute" | "moderation";

export type GuideOfferRow = {
  id: Uuid;
  request_id: Uuid;
  guide_id: Uuid;
  listing_id: Uuid | null;
  title: string | null;
  message: string | null;
  price_minor: number;
  currency: string;
  capacity: number;
  starts_at: string | null;
  ends_at: string | null;
  inclusions: string[];
  expires_at: string | null;
  status: OfferStatus;
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: Uuid;
  traveler_id: Uuid;
  guide_id: Uuid;
  request_id: Uuid | null;
  offer_id: Uuid | null;
  listing_id: Uuid | null;
  status: BookingStatus;
  party_size: number;
  starts_at: string | null;
  ends_at: string | null;
  subtotal_minor: number;
  deposit_minor: number;
  remainder_minor: number;
  currency: string;
  cancellation_policy_snapshot: unknown;
  meeting_point: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: Uuid;
  user_id: Uuid;
  kind: NotificationKindDb;
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

export type ConversationThreadRow = {
  id: Uuid;
  subject_type: ThreadSubject;
  request_id: Uuid | null;
  offer_id: Uuid | null;
  booking_id: Uuid | null;
  dispute_id: Uuid | null;
  created_by: Uuid | null;
  created_at: string;
  updated_at: string;
};

export type ThreadParticipantRow = {
  thread_id: Uuid;
  user_id: Uuid;
  joined_at: string;
  last_read_at: string | null;
};

export type MessageRow = {
  id: Uuid;
  thread_id: Uuid;
  sender_id: Uuid | null;
  sender_role: MessageSenderRole;
  body: string;
  metadata: unknown;
  created_at: string;
};

export type MarketplaceEventRow = {
  id: Uuid;
  scope: EventScope;
  request_id: Uuid | null;
  booking_id: Uuid | null;
  dispute_id: Uuid | null;
  actor_id: Uuid | null;
  event_type: string;
  summary: string;
  detail: string | null;
  payload: unknown;
  created_at: string;
};

