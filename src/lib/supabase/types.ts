export type Uuid = string;

export type AppRoleDb = "traveler" | "guide" | "admin";

export type GuideVerificationStatusDb =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected";

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

export type RequestStatus = "open" | "booked" | "cancelled" | "expired";

export type MemberStatus = "joined" | "left";

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

export type ListingStatusDb = "draft" | "published" | "paused" | "rejected";

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

export type TravelerRequestRow = {
  id: Uuid;
  traveler_id: Uuid;
  destination: string;
  region: string | null;
  category: string;
  starts_on: string;
  ends_on: string | null;
  budget_minor: number | null;
  currency: string;
  participants_count: number;
  format_preference: string | null;
  notes: string | null;
  open_to_join: boolean;
  allow_guide_suggestions: boolean;
  group_capacity: number | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};

export type OpenRequestMemberRow = {
  request_id: Uuid;
  traveler_id: Uuid;
  status: MemberStatus;
  joined_at: string;
  left_at: string | null;
};

export type GuideProfileRow = {
  user_id: Uuid;
  slug: string | null;
  display_name: string | null;
  bio: string | null;
  years_experience: number | null;
  specialization: string | null;
  rating: number;
  completed_tours: number;
  is_available: boolean;
  regions: string[];
  languages: string[];
  specialties: string[];
  attestation_status: string | null;
  verification_status: GuideVerificationStatusDb;
  verification_notes: string | null;
  payout_account_label: string | null;
  created_at: string;
  updated_at: string;
};

export type GuideProfileOnboardingPersistenceRow = Pick<
  GuideProfileRow,
  | "bio"
  | "regions"
  | "languages"
  | "specialties"
  | "specialization"
  | "is_available"
>;

export type ListingRow = {
  id: Uuid;
  guide_id: Uuid;
  slug: string;
  title: string;
  region: string;
  city: string | null;
  category: string;
  route_summary: string | null;
  description: string | null;
  duration_minutes: number | null;
  max_group_size: number;
  price_from_minor: number;
  currency: string;
  private_available: boolean;
  group_available: boolean;
  instant_book: boolean;
  meeting_point: string | null;
  inclusions: string[];
  exclusions: string[];
  cancellation_policy_key: string;
  status: ListingStatusDb;
  featured_rank: number | null;
  created_at: string;
  updated_at: string;
};

export type StorageAssetKindDb =
  | "guide-avatar"
  | "guide-document"
  | "listing-cover"
  | "listing-gallery"
  | "dispute-evidence";

export type StorageAssetRow = {
  id: Uuid;
  owner_id: Uuid;
  bucket_id: string;
  object_path: string;
  asset_kind: StorageAssetKindDb;
  mime_type: string | null;
  byte_size: number | null;
  created_at: string;
};

export type GuideDocumentRow = {
  id: Uuid;
  guide_id: Uuid;
  asset_id: Uuid;
  document_type: string;
  status: GuideVerificationStatusDb;
  admin_note: string | null;
  reviewed_by: Uuid | null;
  reviewed_at: string | null;
  created_at: string;
};

export type ListingMediaRow = {
  id: Uuid;
  listing_id: Uuid;
  asset_id: Uuid;
  is_cover: boolean;
  sort_order: number;
  alt_text: string | null;
  created_at: string;
};

