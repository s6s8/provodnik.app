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
  | "counter_offered"
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
  | "admin_alert"
  | "new_request";

export type ThreadSubject = "request" | "offer" | "booking" | "dispute";

export type MessageSenderRole = "traveler" | "guide" | "admin" | "system";

export type EventScope = "request" | "booking" | "dispute" | "moderation";

export type ListingStatusDb =
  | "draft"
  | "published"
  | "paused"
  | "rejected"
  | "pending_review"
  | "active"
  | "archived";

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
  route_stops: unknown[];
  route_duration_minutes: number | null;
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
  interests: string[];
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
  start_time: string | null;
  end_time: string | null;
  date_flexibility: 'exact' | 'few_days' | 'week';
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

/** Read model for `v_guide_dashboard_kpi` (30d aggregates when present; extra keys from older view shapes are ignored). */
export type GuideDashboardKpiViewRow = {
  guide_id: Uuid;
  views_30d?: number | null;
  requests_30d?: number | null;
  offers_sent_30d?: number | null;
  bookings_30d?: number | null;
  active_listings?: number | null;
  average_rating?: number | null;
  response_rate?: number | null;
  review_count?: number | null;
  listing_count?: number | null;
  active_bookings?: number | null;
  completed_bookings?: number | null;
  open_requests?: number | null;
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
  // Tripster v1 additions
  legal_status: "self_employed" | "individual" | "company" | null;
  inn: string | null;
  document_country: string | null;
  is_tour_operator: boolean;
  tour_operator_registry_number: string | null;
  average_rating: number;
  response_rate: number;
  review_count: number;
  contact_visibility_unlocked: boolean;
  locale: string;
  preferred_currency: string;
  notification_prefs: Record<string, unknown>;
  base_city: string | null;
  max_group_size: number | null;
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

export type GuideProfileUpsert = Pick<
  GuideProfileRow,
  | "user_id"
  | "display_name"
  | "bio"
  | "years_experience"
  | "specialization"
  | "regions"
  | "languages"
  | "specialties"
  | "is_available"
  | "verification_status"
  | "verification_notes"
  | "base_city"
  | "max_group_size"
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
  /** Set when moderation rejects a listing (column may be absent until migrated). */
  rejection_reason?: string | null;
  featured_rank: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // Tripster v1 additions
  exp_type: "excursion" | "waterwalk" | "masterclass" | "photosession" | "quest" | "activity" | "tour" | "transfer" | null;
  format: "group" | "private" | "combo" | null;
  movement_type: string | null;
  languages: string[];
  currencies: string[];
  idea: string | null;
  route: string | null;
  theme: string | null;
  audience: string | null;
  facts: string | null;
  org_details: Record<string, unknown> | null;
  difficulty_level: "easy" | "medium" | "hard" | "extreme" | null;
  included: string[];
  not_included: string[];
  accommodation: Record<string, unknown> | null;
  deposit_rate: number;
  pickup_point_text: string | null;
  dropoff_point_text: string | null;
  vehicle_type: string | null;
  baggage_allowance: string | null;
  pii_gate_rate: number;
  booking_cutoff_hours: number;
  event_span_hours: number | null;
  instant_booking: boolean;
  average_rating: number;
  review_count: number;
};

export type StorageAssetKindDb =
  | "guide-avatar"
  | "guide-document"
  | "listing-cover"
  | "listing-gallery"
  | "dispute-evidence"
  | "guide-portfolio";

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

export type GuideLocationPhotoRow = {
  id: Uuid;
  guide_id: Uuid;
  storage_asset_id: Uuid;
  location_name: string;
  sort_order: number;
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

// ---------------------------------------------------------------------------
// Tripster v1 — new table row types
// ---------------------------------------------------------------------------

/** `public.reviews` row shape for reputation UI (subset; DB may include more columns). */
export type ReviewStatusDb =
  | "draft"
  | "submitted"
  | "published"
  | "flagged"
  | "hidden";

export type ReviewRow = {
  id: Uuid;
  listing_id: Uuid | null;
  guide_id: Uuid | null;
  traveler_id: Uuid;
  rating: number;
  body: string | null;
  status: ReviewStatusDb;
  created_at: string;
};

export type ListingDayRow = {
  listing_id: Uuid;
  day_number: number;
  title: string | null;
  body: string | null;
  date_override: string | null;
};

export type ListingMealRow = {
  listing_id: Uuid;
  day_number: number;
  meal_type: "breakfast" | "lunch" | "dinner";
  status: "included" | "paid_extra" | "not_included";
  note: string | null;
};

export type ListingTourDepartureRow = {
  id: Uuid;
  listing_id: Uuid;
  start_date: string;
  end_date: string;
  price_minor: number;
  currency: string;
  max_persons: number;
  status: string;
};

export type ListingTariffRow = {
  id: Uuid;
  listing_id: Uuid;
  label: string;
  price_minor: number;
  currency: string | null;
  min_persons: number | null;
  max_persons: number | null;
};

export type ListingScheduleRow = {
  id: Uuid;
  listing_id: Uuid;
  weekday: number | null;
  time_start: string;
  time_end: string;
};

export type ListingScheduleExtraRow = {
  id: Uuid;
  listing_id: Uuid;
  date: string;
  time_start: string | null;
  time_end: string | null;
};

/** Guide-owned license document; linked to listings via listing_licenses. */
export type GuideLicenseRow = {
  id: Uuid;
  guide_id: Uuid;
  license_type: string;
  license_number: string;
  issued_by: string;
  valid_until: string | null;
  /** Whether the license applies to all current/future listings (UI) vs selected listings only. */
  scope_mode: "all" | "selected";
  created_at: string;
  updated_at: string;
};

export type ListingLicenseRow = {
  listing_id: Uuid;
  license_id: Uuid;
  scope: string | null;
};

export type ListingPhotoRow = {
  id: Uuid;
  listing_id: Uuid;
  url: string;
  position: number;
  alt_text: string | null;
};

export type ListingVideoRow = {
  id: Uuid;
  listing_id: Uuid;
  url: string;
  poster_url: string | null;
  position: number;
};

export type ReviewRatingsBreakdownRow = {
  review_id: Uuid;
  axis: "material" | "engagement" | "knowledge" | "route";
  score: number;
};

export type ReviewReplyRow = {
  id: Uuid;
  review_id: Uuid;
  guide_id: Uuid;
  body: string;
  status: "draft" | "pending_review" | "published";
  submitted_at: string | null;
  published_at: string | null;
};

export type FavoritesFolderRow = {
  id: Uuid;
  user_id: Uuid;
  name: string;
  position: number;
};

export type FavoritesItemRow = {
  folder_id: Uuid;
  listing_id: Uuid;
  added_at: string;
};

export type NotificationRow2 = {
  id: Uuid;
  user_id: Uuid;
  event_type: string;
  payload: Record<string, unknown> | null;
  channel: "inbox" | "email" | "telegram" | "push" | null;
  status: "pending" | "sent" | "failed" | "read";
  created_at: string;
  read_at: string | null;
};

export type ReferralCodeRow = {
  id: Uuid;
  user_id: Uuid;
  code: string;
  created_at: string;
};

export type ReferralRedemptionRow = {
  code_id: Uuid;
  redeemed_by: Uuid;
  redeemed_at: string;
};

export type BonusLedgerRow = {
  id: Uuid;
  user_id: Uuid;
  delta: number;
  reason: string | null;
  ref_id: Uuid | null;
  created_at: string;
};

export type HelpArticleRow = {
  id: Uuid;
  slug: string;
  category: string | null;
  title: string;
  body_md: string;
  position: number;
};

export type PartnerAccountRow = {
  id: Uuid;
  user_id: Uuid;
  api_token_hash: string;
  created_at: string;
};

export type PartnerPayoutsLedgerRow = {
  id: Uuid;
  partner_id: Uuid;
  delta: number;
  ref_id: Uuid | null;
  created_at: string;
};

export type DisputeRow = {
  id: Uuid;
  booking_id: Uuid | null;
  opened_by: Uuid | null;
  status: "open" | "investigating" | "resolved" | "closed";
  resolution: string | null;
  opened_at: string;
  resolved_at: string | null;
};

export type DisputeEventRow = {
  id: Uuid;
  dispute_id: Uuid;
  actor_id: Uuid | null;
  event_type: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

/** Listing snapshot attached to a direct-booking card (fetched separately). */
export type ListingSnippet = {
  id: Uuid;
  title: string;
  region: string;
  price_from_minor: number;
};

/** BookingRow enriched with optional listing data for direct-booking (Трипстер) mode. */
export type BookingWithListing = BookingRow & {
  listing?: ListingSnippet | null;
};

