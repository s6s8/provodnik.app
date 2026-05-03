export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bonus_ledger: {
        Row: {
          created_at: string | null
          delta: number
          id: string
          reason: string | null
          ref_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delta: number
          id?: string
          reason?: string | null
          ref_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delta?: number
          id?: string
          reason?: string | null
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          cancellation_policy_snapshot: Json
          created_at: string
          currency: string
          deposit_minor: number
          ends_at: string | null
          guide_id: string
          id: string
          listing_id: string | null
          meeting_point: string | null
          offer_id: string | null
          party_size: number
          remainder_minor: number
          request_id: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["booking_status"]
          subtotal_minor: number
          traveler_id: string
          updated_at: string
        }
        Insert: {
          cancellation_policy_snapshot?: Json
          created_at?: string
          currency?: string
          deposit_minor?: number
          ends_at?: string | null
          guide_id: string
          id?: string
          listing_id?: string | null
          meeting_point?: string | null
          offer_id?: string | null
          party_size?: number
          remainder_minor?: number
          request_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_minor?: number
          traveler_id: string
          updated_at?: string
        }
        Update: {
          cancellation_policy_snapshot?: Json
          created_at?: string
          currency?: string
          deposit_minor?: number
          ends_at?: string | null
          guide_id?: string
          id?: string
          listing_id?: string | null
          meeting_point?: string | null
          offer_id?: string | null
          party_size?: number
          remainder_minor?: number
          request_id?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_minor?: number
          traveler_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "guide_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "traveler_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_threads: {
        Row: {
          booking_id: string | null
          created_at: string
          created_by: string | null
          dispute_id: string | null
          id: string
          offer_id: string | null
          request_id: string | null
          subject_type: Database["public"]["Enums"]["thread_subject"]
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          dispute_id?: string | null
          id?: string
          offer_id?: string | null
          request_id?: string | null
          subject_type: Database["public"]["Enums"]["thread_subject"]
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          dispute_id?: string | null
          id?: string
          offer_id?: string | null
          request_id?: string | null
          subject_type?: Database["public"]["Enums"]["thread_subject"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_threads_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_threads_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_threads_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "guide_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_threads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "traveler_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          guides_count: number
          hero_image_url: string | null
          id: string
          listing_count: number
          name: string
          rating: number | null
          region: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          guides_count?: number
          hero_image_url?: string | null
          id?: string
          listing_count?: number
          name: string
          rating?: number | null
          region: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          guides_count?: number
          hero_image_url?: string | null
          id?: string
          listing_count?: number
          name?: string
          rating?: number | null
          region?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      dispute_events: {
        Row: {
          actor_id: string | null
          created_at: string | null
          dispute_id: string
          event_type: string | null
          id: string
          payload: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          dispute_id: string
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          dispute_id?: string
          event_type?: string | null
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_events_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_evidence: {
        Row: {
          asset_id: string
          created_at: string
          dispute_id: string
          id: string
          label: string | null
          uploaded_by: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          dispute_id: string
          id?: string
          label?: string | null
          uploaded_by: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          dispute_id?: string
          id?: string
          label?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_evidence_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "storage_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_evidence_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_notes: {
        Row: {
          author_id: string
          created_at: string
          dispute_id: string
          id: string
          internal_only: boolean
          note: string
        }
        Insert: {
          author_id: string
          created_at?: string
          dispute_id: string
          id?: string
          internal_only?: boolean
          note: string
        }
        Update: {
          author_id?: string
          created_at?: string
          dispute_id?: string
          id?: string
          internal_only?: boolean
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_notes_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          assigned_admin_id: string | null
          booking_id: string
          created_at: string
          id: string
          opened_by: string
          payout_frozen: boolean
          reason: string
          requested_outcome: string | null
          resolution_summary: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          summary: string | null
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          booking_id: string
          created_at?: string
          id?: string
          opened_by: string
          payout_frozen?: boolean
          reason: string
          requested_outcome?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          summary?: string | null
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          opened_by?: string
          payout_frozen?: boolean
          reason?: string
          requested_outcome?: string | null
          resolution_summary?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          guide_id: string | null
          id: string
          listing_id: string | null
          subject: Database["public"]["Enums"]["favorite_subject"]
          user_id: string
        }
        Insert: {
          created_at?: string
          guide_id?: string | null
          id?: string
          listing_id?: string | null
          subject: Database["public"]["Enums"]["favorite_subject"]
          user_id: string
        }
        Update: {
          created_at?: string
          guide_id?: string | null
          id?: string
          listing_id?: string | null
          subject?: Database["public"]["Enums"]["favorite_subject"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites_folders: {
        Row: {
          id: string
          name: string
          position: number | null
          user_id: string
        }
        Insert: {
          id?: string
          name: string
          position?: number | null
          user_id: string
        }
        Update: {
          id?: string
          name?: string
          position?: number | null
          user_id?: string
        }
        Relationships: []
      }
      favorites_items: {
        Row: {
          added_at: string | null
          folder_id: string
          listing_id: string
        }
        Insert: {
          added_at?: string | null
          folder_id: string
          listing_id: string
        }
        Update: {
          added_at?: string | null
          folder_id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "favorites_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "favorites_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_documents: {
        Row: {
          admin_note: string | null
          asset_id: string
          created_at: string
          document_type: string
          guide_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["guide_verification_status"]
        }
        Insert: {
          admin_note?: string | null
          asset_id: string
          created_at?: string
          document_type: string
          guide_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["guide_verification_status"]
        }
        Update: {
          admin_note?: string | null
          asset_id?: string
          created_at?: string
          document_type?: string
          guide_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["guide_verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "guide_documents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "storage_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_documents_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_licenses: {
        Row: {
          created_at: string
          guide_id: string
          id: string
          issued_by: string
          license_number: string
          license_type: string
          scope_mode: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          guide_id: string
          id?: string
          issued_by: string
          license_number: string
          license_type: string
          scope_mode?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          guide_id?: string
          id?: string
          issued_by?: string
          license_number?: string
          license_type?: string
          scope_mode?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_licenses_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_location_photos: {
        Row: {
          created_at: string
          guide_id: string
          id: string
          location_name: string
          sort_order: number
          storage_asset_id: string
        }
        Insert: {
          created_at?: string
          guide_id: string
          id?: string
          location_name: string
          sort_order?: number
          storage_asset_id: string
        }
        Update: {
          created_at?: string
          guide_id?: string
          id?: string
          location_name?: string
          sort_order?: number
          storage_asset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_location_photos_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_location_photos_storage_asset_id_fkey"
            columns: ["storage_asset_id"]
            isOneToOne: false
            referencedRelation: "storage_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_offers: {
        Row: {
          capacity: number
          created_at: string
          currency: string
          ends_at: string | null
          expires_at: string | null
          guide_id: string
          id: string
          inclusions: string[]
          listing_id: string | null
          message: string | null
          price_minor: number
          request_id: string
          route_duration_minutes: number | null
          route_stops: Json
          starts_at: string | null
          status: Database["public"]["Enums"]["offer_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          currency?: string
          ends_at?: string | null
          expires_at?: string | null
          guide_id: string
          id?: string
          inclusions?: string[]
          listing_id?: string | null
          message?: string | null
          price_minor: number
          request_id: string
          route_duration_minutes?: number | null
          route_stops?: Json
          starts_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          currency?: string
          ends_at?: string | null
          expires_at?: string | null
          guide_id?: string
          id?: string
          inclusions?: string[]
          listing_id?: string | null
          message?: string | null
          price_minor?: number
          request_id?: string
          route_duration_minutes?: number | null
          route_stops?: Json
          starts_at?: string | null
          status?: Database["public"]["Enums"]["offer_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_offers_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "guide_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "traveler_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_profiles: {
        Row: {
          attestation_status: string | null
          average_rating: number | null
          base_city: string | null
          bio: string | null
          completed_tours: number
          contact_visibility_unlocked: boolean | null
          created_at: string
          display_name: string | null
          document_country: string | null
          inn: string | null
          is_available: boolean
          is_tour_operator: boolean | null
          languages: string[]
          legal_status: string | null
          locale: string | null
          max_group_size: number | null
          notification_prefs: Json | null
          payout_account_label: string | null
          preferred_currency: string | null
          rating: number
          regions: string[]
          response_rate: number | null
          review_count: number | null
          slug: string | null
          specialization: string | null
          specializations: string[]
          specialties: string[]
          tour_operator_registry_number: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: Database["public"]["Enums"]["guide_verification_status"]
          years_experience: number | null
        }
        Insert: {
          attestation_status?: string | null
          average_rating?: number | null
          base_city?: string | null
          bio?: string | null
          completed_tours?: number
          contact_visibility_unlocked?: boolean | null
          created_at?: string
          display_name?: string | null
          document_country?: string | null
          inn?: string | null
          is_available?: boolean
          is_tour_operator?: boolean | null
          languages?: string[]
          legal_status?: string | null
          locale?: string | null
          max_group_size?: number | null
          notification_prefs?: Json | null
          payout_account_label?: string | null
          preferred_currency?: string | null
          rating?: number
          regions?: string[]
          response_rate?: number | null
          review_count?: number | null
          slug?: string | null
          specialization?: string | null
          specializations?: string[]
          specialties?: string[]
          tour_operator_registry_number?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["guide_verification_status"]
          years_experience?: number | null
        }
        Update: {
          attestation_status?: string | null
          average_rating?: number | null
          base_city?: string | null
          bio?: string | null
          completed_tours?: number
          contact_visibility_unlocked?: boolean | null
          created_at?: string
          display_name?: string | null
          document_country?: string | null
          inn?: string | null
          is_available?: boolean
          is_tour_operator?: boolean | null
          languages?: string[]
          legal_status?: string | null
          locale?: string | null
          max_group_size?: number | null
          notification_prefs?: Json | null
          payout_account_label?: string | null
          preferred_currency?: string | null
          rating?: number
          regions?: string[]
          response_rate?: number | null
          review_count?: number | null
          slug?: string | null
          specialization?: string | null
          specializations?: string[]
          specialties?: string[]
          tour_operator_registry_number?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: Database["public"]["Enums"]["guide_verification_status"]
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          body_md: string
          category: string | null
          id: string
          position: number | null
          slug: string
          title: string
        }
        Insert: {
          body_md: string
          category?: string | null
          id?: string
          position?: number | null
          slug: string
          title: string
        }
        Update: {
          body_md?: string
          category?: string | null
          id?: string
          position?: number | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      listing_days: {
        Row: {
          body: string | null
          date_override: string | null
          day_number: number
          listing_id: string
          title: string | null
        }
        Insert: {
          body?: string | null
          date_override?: string | null
          day_number: number
          listing_id: string
          title?: string | null
        }
        Update: {
          body?: string | null
          date_override?: string | null
          day_number?: number
          listing_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_days_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_days_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_days_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_days_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_days_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_licenses: {
        Row: {
          license_id: string
          listing_id: string
          scope: string | null
        }
        Insert: {
          license_id: string
          listing_id: string
          scope?: string | null
        }
        Update: {
          license_id?: string
          listing_id?: string
          scope?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_licenses_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "guide_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_licenses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_licenses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_licenses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_licenses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_licenses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_meals: {
        Row: {
          day_number: number
          listing_id: string
          meal_type: string
          note: string | null
          status: string
        }
        Insert: {
          day_number: number
          listing_id: string
          meal_type: string
          note?: string | null
          status: string
        }
        Update: {
          day_number?: number
          listing_id?: string
          meal_type?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_meals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_meals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_meals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_meals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_meals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_media: {
        Row: {
          alt_text: string | null
          asset_id: string
          created_at: string
          id: string
          is_cover: boolean
          listing_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          asset_id: string
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          asset_id?: string
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_media_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: true
            referencedRelation: "storage_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_media_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_moderation_events: {
        Row: {
          actor_id: string | null
          created_at: string | null
          from_status: string
          id: string
          listing_id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          from_status: string
          id?: string
          listing_id: string
          reason?: string | null
          to_status: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          from_status?: string
          id?: string
          listing_id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_moderation_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_moderation_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_moderation_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_moderation_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_moderation_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          alt_text: string | null
          id: string
          listing_id: string
          position: number | null
          url: string
        }
        Insert: {
          alt_text?: string | null
          id?: string
          listing_id: string
          position?: number | null
          url: string
        }
        Update: {
          alt_text?: string | null
          id?: string
          listing_id?: string
          position?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_schedule: {
        Row: {
          id: string
          listing_id: string
          time_end: string
          time_start: string
          weekday: number | null
        }
        Insert: {
          id?: string
          listing_id: string
          time_end: string
          time_start: string
          weekday?: number | null
        }
        Update: {
          id?: string
          listing_id?: string
          time_end?: string
          time_start?: string
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_schedule_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_schedule_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_schedule_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_schedule_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_schedule_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_schedule_extras: {
        Row: {
          date: string
          id: string
          listing_id: string
          time_end: string | null
          time_start: string | null
        }
        Insert: {
          date: string
          id?: string
          listing_id: string
          time_end?: string | null
          time_start?: string | null
        }
        Update: {
          date?: string
          id?: string
          listing_id?: string
          time_end?: string | null
          time_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_schedule_extras_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_schedule_extras_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_schedule_extras_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_schedule_extras_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_schedule_extras_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tariffs: {
        Row: {
          currency: string | null
          id: string
          label: string
          listing_id: string
          max_persons: number | null
          min_persons: number | null
          price_minor: number
        }
        Insert: {
          currency?: string | null
          id?: string
          label: string
          listing_id: string
          max_persons?: number | null
          min_persons?: number | null
          price_minor: number
        }
        Update: {
          currency?: string | null
          id?: string
          label?: string
          listing_id?: string
          max_persons?: number | null
          min_persons?: number | null
          price_minor?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_tariffs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tariffs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_tariffs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tariffs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tariffs_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_tour_departures: {
        Row: {
          currency: string
          end_date: string
          id: string
          listing_id: string
          max_persons: number
          price_minor: number
          start_date: string
          status: string
        }
        Insert: {
          currency?: string
          end_date: string
          id?: string
          listing_id: string
          max_persons: number
          price_minor: number
          start_date: string
          status?: string
        }
        Update: {
          currency?: string
          end_date?: string
          id?: string
          listing_id?: string
          max_persons?: number
          price_minor?: number
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_tour_departures_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tour_departures_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_tour_departures_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tour_departures_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_tour_departures_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_videos: {
        Row: {
          id: string
          listing_id: string
          position: number | null
          poster_url: string | null
          url: string
        }
        Insert: {
          id?: string
          listing_id: string
          position?: number | null
          poster_url?: string | null
          url: string
        }
        Update: {
          id?: string
          listing_id?: string
          position?: number | null
          poster_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_videos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          accommodation: Json | null
          audience: string | null
          average_rating: number | null
          baggage_allowance: string | null
          booking_cutoff_hours: number | null
          cancellation_policy_key: string
          category: string
          city: string | null
          created_at: string
          currencies: string[] | null
          currency: string
          deposit_rate: number | null
          description: string | null
          difficulty_level: string | null
          dropoff_point_text: string | null
          duration_minutes: number | null
          event_span_hours: number | null
          exclusions: string[]
          exp_type: string | null
          facts: string | null
          featured_rank: number | null
          format: string | null
          group_available: boolean
          guide_id: string
          id: string
          idea: string | null
          image_url: string | null
          included: string[] | null
          inclusions: string[]
          instant_book: boolean
          instant_booking: boolean | null
          languages: string[] | null
          max_group_size: number
          meeting_point: string | null
          movement_type: string | null
          not_included: string[] | null
          org_details: Json | null
          pickup_point_text: string | null
          pii_gate_rate: number | null
          price_from_minor: number
          private_available: boolean
          region: string
          review_count: number | null
          route: string | null
          route_summary: string | null
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          theme: string | null
          title: string
          updated_at: string
          vehicle_type: string | null
        }
        Insert: {
          accommodation?: Json | null
          audience?: string | null
          average_rating?: number | null
          baggage_allowance?: string | null
          booking_cutoff_hours?: number | null
          cancellation_policy_key?: string
          category: string
          city?: string | null
          created_at?: string
          currencies?: string[] | null
          currency?: string
          deposit_rate?: number | null
          description?: string | null
          difficulty_level?: string | null
          dropoff_point_text?: string | null
          duration_minutes?: number | null
          event_span_hours?: number | null
          exclusions?: string[]
          exp_type?: string | null
          facts?: string | null
          featured_rank?: number | null
          format?: string | null
          group_available?: boolean
          guide_id: string
          id?: string
          idea?: string | null
          image_url?: string | null
          included?: string[] | null
          inclusions?: string[]
          instant_book?: boolean
          instant_booking?: boolean | null
          languages?: string[] | null
          max_group_size?: number
          meeting_point?: string | null
          movement_type?: string | null
          not_included?: string[] | null
          org_details?: Json | null
          pickup_point_text?: string | null
          pii_gate_rate?: number | null
          price_from_minor: number
          private_available?: boolean
          region: string
          review_count?: number | null
          route?: string | null
          route_summary?: string | null
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          theme?: string | null
          title: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Update: {
          accommodation?: Json | null
          audience?: string | null
          average_rating?: number | null
          baggage_allowance?: string | null
          booking_cutoff_hours?: number | null
          cancellation_policy_key?: string
          category?: string
          city?: string | null
          created_at?: string
          currencies?: string[] | null
          currency?: string
          deposit_rate?: number | null
          description?: string | null
          difficulty_level?: string | null
          dropoff_point_text?: string | null
          duration_minutes?: number | null
          event_span_hours?: number | null
          exclusions?: string[]
          exp_type?: string | null
          facts?: string | null
          featured_rank?: number | null
          format?: string | null
          group_available?: boolean
          guide_id?: string
          id?: string
          idea?: string | null
          image_url?: string | null
          included?: string[] | null
          inclusions?: string[]
          instant_book?: boolean
          instant_booking?: boolean | null
          languages?: string[] | null
          max_group_size?: number
          meeting_point?: string | null
          movement_type?: string | null
          not_included?: string[] | null
          org_details?: Json | null
          pickup_point_text?: string | null
          pii_gate_rate?: number | null
          price_from_minor?: number
          private_available?: boolean
          region?: string
          review_count?: number | null
          route?: string | null
          route_summary?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          theme?: string | null
          title?: string
          updated_at?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_events: {
        Row: {
          actor_id: string | null
          booking_id: string | null
          created_at: string
          detail: string | null
          dispute_id: string | null
          event_type: string
          id: string
          payload: Json
          request_id: string | null
          scope: Database["public"]["Enums"]["event_scope"]
          summary: string
        }
        Insert: {
          actor_id?: string | null
          booking_id?: string | null
          created_at?: string
          detail?: string | null
          dispute_id?: string | null
          event_type: string
          id?: string
          payload?: Json
          request_id?: string | null
          scope: Database["public"]["Enums"]["event_scope"]
          summary: string
        }
        Update: {
          actor_id?: string | null
          booking_id?: string | null
          created_at?: string
          detail?: string | null
          dispute_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
          request_id?: string | null
          scope?: Database["public"]["Enums"]["event_scope"]
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_events_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "traveler_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata: Json
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          metadata?: Json
          sender_id?: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          admin_id: string
          case_id: string
          created_at: string
          decision: Database["public"]["Enums"]["moderation_decision"]
          id: string
          note: string | null
        }
        Insert: {
          admin_id: string
          case_id: string
          created_at?: string
          decision: Database["public"]["Enums"]["moderation_decision"]
          id?: string
          note?: string | null
        }
        Update: {
          admin_id?: string
          case_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["moderation_decision"]
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "moderation_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_cases: {
        Row: {
          assigned_admin_id: string | null
          created_at: string
          guide_id: string | null
          id: string
          listing_id: string | null
          opened_by: string | null
          queue_reason: string
          review_id: string | null
          risk_flags: string[]
          status: string
          subject_type: Database["public"]["Enums"]["moderation_subject"]
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          created_at?: string
          guide_id?: string | null
          id?: string
          listing_id?: string | null
          opened_by?: string | null
          queue_reason: string
          review_id?: string | null
          risk_flags?: string[]
          status?: string
          subject_type: Database["public"]["Enums"]["moderation_subject"]
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          created_at?: string
          guide_id?: string | null
          id?: string
          listing_id?: string | null
          opened_by?: string | null
          queue_reason?: string
          review_id?: string | null
          risk_flags?: string[]
          status?: string
          subject_type?: Database["public"]["Enums"]["moderation_subject"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_cases_assigned_admin_id_fkey"
            columns: ["assigned_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "moderation_cases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_cases_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_deliveries: {
        Row: {
          attempted_at: string | null
          channel: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          notification_id: string
          provider_message_id: string | null
          status: string
        }
        Insert: {
          attempted_at?: string | null
          channel: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id: string
          provider_message_id?: string | null
          status?: string
        }
        Update: {
          attempted_at?: string | null
          channel?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          notification_id?: string
          provider_message_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          is_read: boolean
          kind: Database["public"]["Enums"]["notification_kind"]
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          is_read?: boolean
          kind: Database["public"]["Enums"]["notification_kind"]
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          is_read?: boolean
          kind?: Database["public"]["Enums"]["notification_kind"]
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      open_request_members: {
        Row: {
          joined_at: string
          left_at: string | null
          request_id: string
          status: Database["public"]["Enums"]["member_status"]
          traveler_id: string
        }
        Insert: {
          joined_at?: string
          left_at?: string | null
          request_id: string
          status?: Database["public"]["Enums"]["member_status"]
          traveler_id: string
        }
        Update: {
          joined_at?: string
          left_at?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["member_status"]
          traveler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "open_request_members_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "traveler_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_request_members_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_accounts: {
        Row: {
          api_token_hash: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          api_token_hash: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          api_token_hash?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_payouts_ledger: {
        Row: {
          created_at: string | null
          delta: number
          id: string
          partner_id: string
          ref_id: string | null
        }
        Insert: {
          created_at?: string | null
          delta: number
          id?: string
          partner_id: string
          ref_id?: string | null
        }
        Update: {
          created_at?: string | null
          delta?: number
          id?: string
          partner_id?: string
          ref_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_ledger_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quality_snapshots: {
        Row: {
          completion_rate: number | null
          rating_avg: number | null
          response_time_hours: number | null
          review_count: number
          subject_slug: string
          subject_type: string
          tier: string
          updated_at: string
        }
        Insert: {
          completion_rate?: number | null
          rating_avg?: number | null
          response_time_hours?: number | null
          review_count?: number
          subject_slug: string
          subject_type: string
          tier?: string
          updated_at?: string
        }
        Update: {
          completion_rate?: number | null
          rating_avg?: number | null
          response_time_hours?: number | null
          review_count?: number
          subject_slug?: string
          subject_type?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_redemptions: {
        Row: {
          code_id: string
          redeemed_at: string | null
          redeemed_by: string
        }
        Insert: {
          code_id: string
          redeemed_at?: string | null
          redeemed_by: string
        }
        Update: {
          code_id?: string
          redeemed_at?: string | null
          redeemed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      review_ratings_breakdown: {
        Row: {
          axis: string
          review_id: string
          score: number
        }
        Insert: {
          axis: string
          review_id: string
          score: number
        }
        Update: {
          axis?: string
          review_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_ratings_breakdown_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          body: string
          guide_id: string
          id: string
          published_at: string | null
          review_id: string
          status: string | null
          submitted_at: string | null
        }
        Insert: {
          body: string
          guide_id: string
          id?: string
          published_at?: string | null
          review_id: string
          status?: string | null
          submitted_at?: string | null
        }
        Update: {
          body?: string
          guide_id?: string
          id?: string
          published_at?: string | null
          review_id?: string
          status?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string
          created_at: string
          guide_id: string | null
          id: string
          listing_id: string | null
          rating: number
          status: Database["public"]["Enums"]["review_status"]
          title: string | null
          traveler_id: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          booking_id: string
          created_at?: string
          guide_id?: string | null
          id?: string
          listing_id?: string | null
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          traveler_id: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          booking_id?: string
          created_at?: string
          guide_id?: string | null
          id?: string
          listing_id?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
          title?: string | null
          traveler_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listing_stats"
            referencedColumns: ["listing_id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_card"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_excursion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "v_listing_detail_tour"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_assets: {
        Row: {
          asset_kind: Database["public"]["Enums"]["storage_asset_kind"]
          bucket_id: string
          byte_size: number | null
          created_at: string
          id: string
          mime_type: string | null
          object_path: string
          owner_id: string
        }
        Insert: {
          asset_kind: Database["public"]["Enums"]["storage_asset_kind"]
          bucket_id: string
          byte_size?: number | null
          created_at?: string
          id?: string
          mime_type?: string | null
          object_path: string
          owner_id: string
        }
        Update: {
          asset_kind?: Database["public"]["Enums"]["storage_asset_kind"]
          bucket_id?: string
          byte_size?: number | null
          created_at?: string
          id?: string
          mime_type?: string | null
          object_path?: string
          owner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_assets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          joined_at: string
          last_read_at: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          last_read_at?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          last_read_at?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "conversation_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_requests: {
        Row: {
          allow_guide_suggestions: boolean
          budget_minor: number | null
          created_at: string
          currency: string
          destination: string
          end_time: string | null
          ends_on: string | null
          format_preference: string | null
          group_capacity: number | null
          id: string
          interests: string[]
          notes: string | null
          open_to_join: boolean
          participants_count: number
          region: string | null
          start_time: string | null
          starts_on: string
          status: Database["public"]["Enums"]["request_status"]
          traveler_id: string
          updated_at: string
        }
        Insert: {
          allow_guide_suggestions?: boolean
          budget_minor?: number | null
          created_at?: string
          currency?: string
          destination: string
          end_time?: string | null
          ends_on?: string | null
          format_preference?: string | null
          group_capacity?: number | null
          id?: string
          interests?: string[]
          notes?: string | null
          open_to_join?: boolean
          participants_count?: number
          region?: string | null
          start_time?: string | null
          starts_on: string
          status?: Database["public"]["Enums"]["request_status"]
          traveler_id: string
          updated_at?: string
        }
        Update: {
          allow_guide_suggestions?: boolean
          budget_minor?: number | null
          created_at?: string
          currency?: string
          destination?: string
          end_time?: string | null
          ends_on?: string | null
          format_preference?: string | null
          group_capacity?: number | null
          id?: string
          interests?: string[]
          notes?: string | null
          open_to_join?: boolean
          participants_count?: number
          region?: string | null
          start_time?: string | null
          starts_on?: string
          status?: Database["public"]["Enums"]["request_status"]
          traveler_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_requests_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_guide_stats: {
        Row: {
          active_bookings_count: number | null
          average_rating: number | null
          cancelled_bookings_count: number | null
          completed_bookings_count: number | null
          guide_id: string | null
          reviews_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_profiles_user_id_fkey"
            columns: ["guide_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_listing_stats: {
        Row: {
          average_rating: number | null
          completed_bookings_count: number | null
          listing_id: string | null
          reviews_count: number | null
        }
        Relationships: []
      }
      v_guide_dashboard_kpi: {
        Row: {
          active_bookings: number | null
          average_rating: number | null
          completed_bookings: number | null
          guide_id: string | null
          listing_count: number | null
          open_requests: number | null
          response_rate: number | null
          review_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_profiles_user_id_fkey"
            columns: ["guide_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_guide_public_profile: {
        Row: {
          average_rating: number | null
          bio: string | null
          contact_visibility_unlocked: boolean | null
          display_name: string | null
          is_available: boolean | null
          languages: string[] | null
          locale: string | null
          preferred_currency: string | null
          regions: string[] | null
          response_rate: number | null
          review_count: number | null
          slug: string | null
          specialties: string[] | null
          user_id: string | null
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          contact_visibility_unlocked?: boolean | null
          display_name?: string | null
          is_available?: boolean | null
          languages?: string[] | null
          locale?: string | null
          preferred_currency?: string | null
          regions?: string[] | null
          response_rate?: number | null
          review_count?: number | null
          slug?: string | null
          specialties?: string[] | null
          user_id?: string | null
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          contact_visibility_unlocked?: boolean | null
          display_name?: string | null
          is_available?: boolean | null
          languages?: string[] | null
          locale?: string | null
          preferred_currency?: string | null
          regions?: string[] | null
          response_rate?: number | null
          review_count?: number | null
          slug?: string | null
          specialties?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      v_listing_card: {
        Row: {
          average_rating: number | null
          exp_type: string | null
          format: string | null
          id: string | null
          image_url: string | null
          languages: string[] | null
          price: number | null
          review_count: number | null
          title: string | null
        }
        Insert: {
          average_rating?: number | null
          exp_type?: string | null
          format?: string | null
          id?: string | null
          image_url?: string | null
          languages?: string[] | null
          price?: number | null
          review_count?: number | null
          title?: string | null
        }
        Update: {
          average_rating?: number | null
          exp_type?: string | null
          format?: string | null
          id?: string | null
          image_url?: string | null
          languages?: string[] | null
          price?: number | null
          review_count?: number | null
          title?: string | null
        }
        Relationships: []
      }
      v_listing_detail_excursion: {
        Row: {
          average_rating: number | null
          booking_cutoff_hours: number | null
          currency: string | null
          description: string | null
          duration_minutes: number | null
          exp_type: string | null
          format: string | null
          id: string | null
          included: string[] | null
          instant_booking: boolean | null
          languages: string[] | null
          meeting_point: string | null
          not_included: string[] | null
          photos: Json | null
          pii_gate_rate: number | null
          price_from_minor: number | null
          review_count: number | null
          schedule: Json | null
          tariffs: Json | null
          title: string | null
        }
        Relationships: []
      }
      v_listing_detail_tour: {
        Row: {
          accommodation: Json | null
          average_rating: number | null
          booking_cutoff_hours: number | null
          currency: string | null
          days: Json | null
          departures: Json | null
          description: string | null
          difficulty_level: string | null
          exp_type: string | null
          format: string | null
          id: string | null
          included: string[] | null
          instant_booking: boolean | null
          languages: string[] | null
          meals: Json | null
          not_included: string[] | null
          photos: Json | null
          pii_gate_rate: number | null
          price_from_minor: number | null
          review_count: number | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_offer: {
        Args: { p_offer_id: string; p_traveler_id: string }
        Returns: string
      }
      can_access_booking_thread: {
        Args: { target_booking_id: string; target_user_id?: string }
        Returns: boolean
      }
      can_access_conversation_thread: {
        Args: { target_thread_id: string; target_user_id?: string }
        Returns: boolean
      }
      can_access_dispute_thread: {
        Args: { target_dispute_id: string; target_user_id?: string }
        Returns: boolean
      }
      can_access_offer_thread: {
        Args: { target_offer_id: string; target_user_id?: string }
        Returns: boolean
      }
      can_access_request_thread: {
        Args: { target_request_id: string; target_user_id?: string }
        Returns: boolean
      }
      can_create_conversation_thread: {
        Args: {
          target_booking_id: string
          target_dispute_id: string
          target_offer_id: string
          target_request_id: string
          target_subject_type: Database["public"]["Enums"]["thread_subject"]
          target_user_id?: string
        }
        Returns: boolean
      }
      clean_text_array: { Args: { input_array: string[] }; Returns: string[] }
      current_profile_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      fn_batch_refresh_all_ratings: { Args: never; Returns: undefined }
      fn_deliver_pending_notifications: { Args: never; Returns: undefined }
      fn_notify_user: {
        Args: {
          p_event_type: string
          p_notification_prefs?: Json
          p_payload: Json
          p_user_id: string
        }
        Returns: undefined
      }
      fn_refresh_contact_visibility: {
        Args: { p_guide_id: string }
        Returns: undefined
      }
      fn_refresh_guide_rating: {
        Args: { p_guide_id: string }
        Returns: undefined
      }
      fn_refresh_listing_rating: {
        Args: { p_listing_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_guide: { Args: never; Returns: boolean }
      is_thread_participant: { Args: { p_thread_id: string }; Returns: boolean }
      send_qa_message: {
        Args: {
          p_body: string
          p_sender_id: string
          p_sender_role: Database["public"]["Enums"]["message_sender_role"]
          p_thread_id: string
        }
        Returns: undefined
      }
      user_has_role: {
        Args: {
          expected_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "traveler" | "guide" | "admin"
      booking_status:
        | "pending"
        | "awaiting_guide_confirmation"
        | "confirmed"
        | "cancelled"
        | "completed"
        | "disputed"
        | "no_show"
      dispute_status: "open" | "under_review" | "resolved" | "closed"
      event_scope: "request" | "booking" | "dispute" | "moderation"
      favorite_subject: "listing" | "guide"
      guide_verification_status: "draft" | "submitted" | "approved" | "rejected"
      listing_status:
        | "draft"
        | "published"
        | "paused"
        | "rejected"
        | "pending_review"
        | "active"
        | "archived"
      member_status: "joined" | "left"
      message_sender_role: "traveler" | "guide" | "admin" | "system"
      moderation_decision:
        | "approve"
        | "reject"
        | "request_changes"
        | "hide"
        | "restore"
      moderation_subject: "guide_profile" | "listing" | "review"
      notification_kind:
        | "new_offer"
        | "offer_expiring"
        | "booking_created"
        | "booking_confirmed"
        | "booking_cancelled"
        | "booking_completed"
        | "dispute_opened"
        | "review_requested"
        | "admin_alert"
        | "new_request"
      offer_status:
        | "pending"
        | "accepted"
        | "declined"
        | "expired"
        | "withdrawn"
        | "bid_sent"
        | "confirmed"
        | "active"
        | "completed"
        | "counter_offered"
      request_status: "open" | "booked" | "cancelled" | "expired"
      review_status: "published" | "flagged" | "hidden" | "draft" | "submitted"
      storage_asset_kind:
        | "guide-avatar"
        | "guide-document"
        | "listing-cover"
        | "listing-gallery"
        | "dispute-evidence"
        | "guide-portfolio"
      thread_subject: "request" | "offer" | "booking" | "dispute"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["traveler", "guide", "admin"],
      booking_status: [
        "pending",
        "awaiting_guide_confirmation",
        "confirmed",
        "cancelled",
        "completed",
        "disputed",
        "no_show",
      ],
      dispute_status: ["open", "under_review", "resolved", "closed"],
      event_scope: ["request", "booking", "dispute", "moderation"],
      favorite_subject: ["listing", "guide"],
      guide_verification_status: ["draft", "submitted", "approved", "rejected"],
      listing_status: [
        "draft",
        "published",
        "paused",
        "rejected",
        "pending_review",
        "active",
        "archived",
      ],
      member_status: ["joined", "left"],
      message_sender_role: ["traveler", "guide", "admin", "system"],
      moderation_decision: [
        "approve",
        "reject",
        "request_changes",
        "hide",
        "restore",
      ],
      moderation_subject: ["guide_profile", "listing", "review"],
      notification_kind: [
        "new_offer",
        "offer_expiring",
        "booking_created",
        "booking_confirmed",
        "booking_cancelled",
        "booking_completed",
        "dispute_opened",
        "review_requested",
        "admin_alert",
        "new_request",
      ],
      offer_status: [
        "pending",
        "accepted",
        "declined",
        "expired",
        "withdrawn",
        "bid_sent",
        "confirmed",
        "active",
        "completed",
        "counter_offered",
      ],
      request_status: ["open", "booked", "cancelled", "expired"],
      review_status: ["published", "flagged", "hidden", "draft", "submitted"],
      storage_asset_kind: [
        "guide-avatar",
        "guide-document",
        "listing-cover",
        "listing-gallery",
        "dispute-evidence",
        "guide-portfolio",
      ],
      thread_subject: ["request", "offer", "booking", "dispute"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
