import type {
  BookingRow,
  GuideOfferRow,
  GuideProfileRow,
  GuideProfileUpsert,
  ListingMediaRow,
  ListingRow,
  TravelerRequestRow,
} from "@/lib/supabase/types";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      destinations: {
        Row: {
          id: string;
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
      };
      profiles: {
        Row: {
          id: string;
          role: "traveler" | "guide" | "admin" | null;
          slug: string | null;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          home_base: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      guide_profiles: {
        Row: GuideProfileRow;
        Insert: GuideProfileUpsert;
        Update: Partial<GuideProfileUpsert>;
      };
      listings: {
        Row: ListingRow;
      };
      listing_media: {
        Row: ListingMediaRow;
      };
      traveler_requests: {
        Row: TravelerRequestRow;
      };
      guide_offers: {
        Row: GuideOfferRow;
      };
      bookings: {
        Row: BookingRow;
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string;
          created_at: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          target_type: "guide" | "listing";
          target_slug: string;
          author_name: string;
          rating: number;
          title: string | null;
          body: string | null;
          created_at: string;
        };
      };
    };
  };
}
