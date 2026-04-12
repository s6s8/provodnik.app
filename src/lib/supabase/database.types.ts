import type {
  AppRoleDb,
  BookingRow,
  BookingStatus,
  ConversationThreadRow,
  EventScope,
  GuideDocumentRow,
  GuideOfferRow,
  GuideLicenseRow,
  GuideProfileRow,
  GuideProfileUpsert,
  GuideVerificationStatusDb,
  ListingLicenseRow,
  ListingMediaRow,
  ListingRow,
  ListingStatusDb,
  MarketplaceEventRow,
  MemberStatus,
  MessageRow,
  MessageSenderRole,
  NotificationKindDb,
  NotificationRow,
  OfferStatus,
  OpenRequestMemberRow,
  RequestStatus,
  StorageAssetKindDb,
  StorageAssetRow,
  ThreadParticipantRow,
  ThreadSubject,
  TravelerRequestRow,
  Uuid,
} from "@/lib/supabase/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: {
    foreignKeyName: string;
    columns: string[];
    referencedRelation: string;
    referencedColumns: string[];
  }[];
};

type ProfileRow = {
  id: Uuid;
  role: AppRoleDb;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type FavoriteRow = {
  id: Uuid;
  user_id: Uuid;
  subject: "listing" | "guide";
  listing_id: Uuid | null;
  guide_id: Uuid | null;
  created_at: string;
};

type ReviewRow = {
  id: Uuid;
  booking_id: Uuid;
  traveler_id: Uuid;
  guide_id: Uuid | null;
  listing_id: Uuid | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: "published" | "flagged" | "hidden";
  created_at: string;
  updated_at: string;
};

type DisputeRow = {
  id: Uuid;
  booking_id: Uuid;
  opened_by: Uuid;
  assigned_admin_id: Uuid | null;
  status: "open" | "under_review" | "resolved" | "closed";
  reason: string;
  summary: string | null;
  requested_outcome: string | null;
  payout_frozen: boolean;
  resolution_summary: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

type DisputeNoteRow = {
  id: Uuid;
  dispute_id: Uuid;
  author_id: Uuid;
  note: string;
  internal_only: boolean;
  created_at: string;
};

type NotificationDeliveryRow = {
  id: Uuid;
  notification_id: Uuid;
  channel: string;
  status: string;
  provider_message_id: string | null;
  attempted_at: string | null;
  delivered_at: string | null;
  error_message: string | null;
  created_at: string;
};

type ModerationCaseRow = {
  id: Uuid;
  subject_type: "guide_profile" | "listing" | "review";
  guide_id: Uuid | null;
  listing_id: Uuid | null;
  review_id: Uuid | null;
  opened_by: Uuid | null;
  assigned_admin_id: Uuid | null;
  status: string;
  queue_reason: string;
  risk_flags: string[];
  created_at: string;
  updated_at: string;
};

type ModerationActionRow = {
  id: Uuid;
  case_id: Uuid;
  admin_id: Uuid | null;
  decision: "approve" | "reject" | "request_changes" | "hide" | "restore";
  note: string | null;
  created_at: string;
};

type DestinationRow = {
  id: Uuid;
  slug: string;
  name: string;
  region: string | null;
  category: string | null;
  description: string | null;
  hero_image_url: string | null;
  listing_count: number | null;
  guides_count: number | null;
  rating: number | null;
  created_at: string | null;
};

type QualitySnapshotRow = {
  id: Uuid;
  run_label: string;
  subject_type: string;
  subject_id: string;
  metric_key: string;
  metric_value: Json;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<ProfileRow>;
      guide_profiles: TableDefinition<GuideProfileRow, GuideProfileUpsert, Partial<GuideProfileUpsert>>;
      guide_licenses: TableDefinition<
        GuideLicenseRow,
        Pick<GuideLicenseRow, "guide_id" | "license_type" | "license_number" | "issued_by"> &
          Partial<Pick<GuideLicenseRow, "valid_until" | "scope_mode">>,
        Partial<
          Pick<
            GuideLicenseRow,
            "license_type" | "license_number" | "issued_by" | "valid_until" | "scope_mode" | "updated_at"
          >
        >
      >;
      listings: TableDefinition<ListingRow, Partial<ListingRow> & Pick<ListingRow, "guide_id" | "slug" | "title" | "region" | "category" | "price_from_minor">>;
      listing_licenses: TableDefinition<
        ListingLicenseRow,
        Pick<ListingLicenseRow, "listing_id" | "license_id"> & Partial<Pick<ListingLicenseRow, "scope">>,
        Partial<Pick<ListingLicenseRow, "scope">>
      >;
      traveler_requests: TableDefinition<TravelerRequestRow, Partial<TravelerRequestRow> & Pick<TravelerRequestRow, "traveler_id" | "destination" | "category" | "starts_on">>;
      open_request_members: TableDefinition<OpenRequestMemberRow, Partial<OpenRequestMemberRow> & Pick<OpenRequestMemberRow, "request_id" | "traveler_id">>;
      guide_offers: TableDefinition<GuideOfferRow, Partial<GuideOfferRow> & Pick<GuideOfferRow, "request_id" | "guide_id" | "price_minor">>;
      bookings: TableDefinition<BookingRow, Partial<BookingRow> & Pick<BookingRow, "traveler_id" | "guide_id">>;
      favorites: TableDefinition<FavoriteRow>;
      notifications: TableDefinition<NotificationRow, Partial<NotificationRow> & Pick<NotificationRow, "user_id" | "kind" | "title">>;
      reviews: TableDefinition<ReviewRow, Partial<ReviewRow> & Pick<ReviewRow, "booking_id" | "traveler_id" | "rating">>;
      disputes: TableDefinition<DisputeRow, Partial<DisputeRow> & Pick<DisputeRow, "booking_id" | "opened_by" | "reason">>;
      dispute_notes: TableDefinition<DisputeNoteRow, Partial<DisputeNoteRow> & Pick<DisputeNoteRow, "dispute_id" | "author_id" | "note">>;
      conversation_threads: TableDefinition<ConversationThreadRow, Partial<ConversationThreadRow> & Pick<ConversationThreadRow, "subject_type">>;
      thread_participants: TableDefinition<ThreadParticipantRow, Partial<ThreadParticipantRow> & Pick<ThreadParticipantRow, "thread_id" | "user_id">>;
      messages: TableDefinition<MessageRow, Partial<MessageRow> & Pick<MessageRow, "thread_id" | "sender_role" | "body">>;
      marketplace_events: TableDefinition<MarketplaceEventRow, Partial<MarketplaceEventRow> & Pick<MarketplaceEventRow, "scope" | "event_type" | "summary">>;
      notification_deliveries: TableDefinition<NotificationDeliveryRow, Partial<NotificationDeliveryRow> & Pick<NotificationDeliveryRow, "notification_id" | "channel">>;
      storage_assets: TableDefinition<StorageAssetRow, Partial<StorageAssetRow> & Pick<StorageAssetRow, "owner_id" | "bucket_id" | "object_path" | "asset_kind">>;
      guide_documents: TableDefinition<GuideDocumentRow, Partial<GuideDocumentRow> & Pick<GuideDocumentRow, "guide_id" | "asset_id" | "document_type">>;
      listing_media: TableDefinition<ListingMediaRow, Partial<ListingMediaRow> & Pick<ListingMediaRow, "listing_id" | "asset_id">>;
      moderation_cases: TableDefinition<ModerationCaseRow>;
      moderation_actions: TableDefinition<ModerationActionRow>;
      quality_snapshots: TableDefinition<QualitySnapshotRow>;
      destinations: TableDefinition<DestinationRow>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_access_booking_thread: {
        Args: { target_booking_id: string; target_user_id?: string };
        Returns: boolean;
      };
      can_access_conversation_thread: {
        Args: { target_thread_id: string; target_user_id?: string };
        Returns: boolean;
      };
      can_access_dispute_thread: {
        Args: { target_dispute_id: string; target_user_id?: string };
        Returns: boolean;
      };
      can_access_offer_thread: {
        Args: { target_offer_id: string; target_user_id?: string };
        Returns: boolean;
      };
      can_access_request_thread: {
        Args: { target_request_id: string; target_user_id?: string };
        Returns: boolean;
      };
      can_create_conversation_thread: {
        Args: {
          target_subject_type: ThreadSubject;
          target_request_id: string | null;
          target_offer_id: string | null;
          target_booking_id: string | null;
          target_dispute_id: string | null;
          target_user_id?: string;
        };
        Returns: boolean;
      };
      clean_text_array: {
        Args: { input_array: string[] | null };
        Returns: string[];
      };
      current_profile_role: {
        Args: Record<PropertyKey, never>;
        Returns: AppRoleDb | null;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_guide: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      user_has_role: {
        Args: { target_user_id: string; expected_role: AppRoleDb };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: AppRoleDb;
      booking_status: BookingStatus;
      event_scope: EventScope;
      guide_verification_status: GuideVerificationStatusDb;
      listing_status: ListingStatusDb;
      member_status: MemberStatus;
      message_sender_role: MessageSenderRole;
      notification_kind: NotificationKindDb;
      offer_status: OfferStatus;
      request_status: RequestStatus;
      storage_asset_kind: StorageAssetKindDb;
      thread_subject: ThreadSubject;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
