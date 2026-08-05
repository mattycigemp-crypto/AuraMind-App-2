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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _backup_cards_legacy_srs: {
        Row: {
          backed_up_at: string
          id: string
          interval: number | null
          last_reviewed: string | null
          next_review: string | null
          repetition: number | null
        }
        Insert: {
          backed_up_at?: string
          id: string
          interval?: number | null
          last_reviewed?: string | null
          next_review?: string | null
          repetition?: number | null
        }
        Update: {
          backed_up_at?: string
          id?: string
          interval?: number | null
          last_reviewed?: string | null
          next_review?: string | null
          repetition?: number | null
        }
        Relationships: []
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          deck_id: string | null
          deck_name: string | null
          id: string
          messages: Json
          mode: string | null
          pinned: boolean | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deck_id?: string | null
          deck_name?: string | null
          id: string
          messages?: Json
          mode?: string | null
          pinned?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deck_id?: string | null
          deck_name?: string | null
          id?: string
          messages?: Json
          mode?: string | null
          pinned?: boolean | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      admin_roles: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_generation_logs: {
        Row: {
          back: string
          created_at: string | null
          deck_id: string | null
          difficulty: string | null
          front: string
          id: string
          prompt: string
          taxonomy: string | null
          user_id: string | null
        }
        Insert: {
          back: string
          created_at?: string | null
          deck_id?: string | null
          difficulty?: string | null
          front: string
          id?: string
          prompt: string
          taxonomy?: string | null
          user_id?: string | null
        }
        Update: {
          back?: string
          created_at?: string | null
          deck_id?: string | null
          difficulty?: string | null
          front?: string
          id?: string
          prompt?: string
          taxonomy?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_logs_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_usage: {
        Row: {
          count: number
          usage_date: string
          user_id: string
        }
        Insert: {
          count?: number
          usage_date?: string
          user_id: string
        }
        Update: {
          count?: number
          usage_date?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_email: string
          actor_id: string | null
          category: string
          created_at: string | null
          details: string | null
          id: string
          metadata: Json | null
          severity: string
          target_email: string | null
          target_id: string | null
        }
        Insert: {
          action: string
          actor_email: string
          actor_id?: string | null
          category: string
          created_at?: string | null
          details?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          target_email?: string | null
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_email?: string
          actor_id?: string | null
          category?: string
          created_at?: string | null
          details?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          target_email?: string | null
          target_id?: string | null
        }
        Relationships: []
      }
      card_reviews: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          rating: number
          reviewed_at: string
          srs_algorithm: string
          srs_result: Json
          synced_at: string | null
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          rating: number
          reviewed_at?: string
          srs_algorithm?: string
          srs_result: Json
          synced_at?: string | null
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          reviewed_at?: string
          srs_algorithm?: string
          srs_result?: Json
          synced_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: true
            referencedRelation: "card_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: true
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          back: string
          created_at: string
          custom_interval_minutes: number | null
          deck_id: string
          ease_factor: number
          front: string
          fsrs_state: Json | null
          id: string
          interval: number | null
          interval_days: number
          lapses: number
          last_reviewed: string | null
          next_review: string | null
          next_review_at: string
          repetition: number | null
          repetitions: number
          source_type: string | null
          trust_score: number | null
          updated_at: string
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          back: string
          created_at?: string
          custom_interval_minutes?: number | null
          deck_id: string
          ease_factor?: number
          front: string
          fsrs_state?: Json | null
          id?: string
          interval?: number | null
          interval_days?: number
          lapses?: number
          last_reviewed?: string | null
          next_review?: string | null
          next_review_at?: string
          repetition?: number | null
          repetitions?: number
          source_type?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          back?: string
          created_at?: string
          custom_interval_minutes?: number | null
          deck_id?: string
          ease_factor?: number
          front?: string
          fsrs_state?: Json | null
          id?: string
          interval?: number | null
          interval_days?: number
          lapses?: number
          last_reviewed?: string | null
          next_review?: string | null
          next_review_at?: string
          repetition?: number | null
          repetitions?: number
          source_type?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          messages: Json | null
          model: string | null
          response_preview: string | null
          success: boolean | null
          tokens_generated: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          messages?: Json | null
          model?: string | null
          response_preview?: string | null
          success?: boolean | null
          tokens_generated?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          messages?: Json | null
          model?: string | null
          response_preview?: string | null
          success?: boolean | null
          tokens_generated?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      client_errors: {
        Row: {
          component_stack: string | null
          created_at: string | null
          id: string
          message: string
          path: string | null
          stack: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_stack?: string | null
          created_at?: string | null
          id?: string
          message: string
          path?: string | null
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_stack?: string | null
          created_at?: string | null
          id?: string
          message?: string
          path?: string | null
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      debug_email_logs: {
        Row: {
          body: Json | null
          created_at: string | null
          email: string | null
          error: string | null
          id: string
          success: boolean | null
          type: string | null
        }
        Insert: {
          body?: Json | null
          created_at?: string | null
          email?: string | null
          error?: string | null
          id?: string
          success?: boolean | null
          type?: string | null
        }
        Update: {
          body?: Json | null
          created_at?: string | null
          email?: string | null
          error?: string | null
          id?: string
          success?: boolean | null
          type?: string | null
        }
        Relationships: []
      }
      decks: {
        Row: {
          card_style_overrides: Json | null
          created_at: string
          description: string | null
          fork_count: number | null
          id: string
          image_url: string | null
          is_public: boolean | null
          marketplace_category: string | null
          marketplace_description: string | null
          marketplace_tags: string[] | null
          name: string
          original_deck_id: string | null
          published_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          card_style_overrides?: Json | null
          created_at?: string
          description?: string | null
          fork_count?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          marketplace_category?: string | null
          marketplace_description?: string | null
          marketplace_tags?: string[] | null
          name: string
          original_deck_id?: string | null
          published_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          card_style_overrides?: Json | null
          created_at?: string
          description?: string | null
          fork_count?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          marketplace_category?: string | null
          marketplace_description?: string | null
          marketplace_tags?: string[] | null
          name?: string
          original_deck_id?: string | null
          published_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decks_original_deck_id_fkey"
            columns: ["original_deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          created_at: string | null
          deck_sharing_notifications_enabled: boolean | null
          reminder_time: string | null
          study_reminders_enabled: boolean | null
          updated_at: string | null
          user_id: string
          weekly_reports_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          deck_sharing_notifications_enabled?: boolean | null
          reminder_time?: string | null
          study_reminders_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          weekly_reports_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          deck_sharing_notifications_enabled?: boolean | null
          reminder_time?: string | null
          study_reminders_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          weekly_reports_enabled?: boolean | null
        }
        Relationships: []
      }
      fact_check_history: {
        Row: {
          card_id: string | null
          checked_at: string | null
          confidence: number | null
          id: string
          issues: Json | null
          sources: Json | null
          suggestions: Json | null
          user_id: string
          verified: boolean
        }
        Insert: {
          card_id?: string | null
          checked_at?: string | null
          confidence?: number | null
          id?: string
          issues?: Json | null
          sources?: Json | null
          suggestions?: Json | null
          user_id: string
          verified: boolean
        }
        Update: {
          card_id?: string | null
          checked_at?: string | null
          confidence?: number | null
          id?: string
          issues?: Json | null
          sources?: Json | null
          suggestions?: Json | null
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fact_check_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "card_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_check_history_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
      }
      league_memberships: {
        Row: {
          accuracy_rate: number
          id: string
          league_group_id: string
          season_id: string
          tier: number
          updated_at: string
          user_id: string
          weekly_xp: number
        }
        Insert: {
          accuracy_rate?: number
          id?: string
          league_group_id: string
          season_id: string
          tier: number
          updated_at?: string
          user_id: string
          weekly_xp?: number
        }
        Update: {
          accuracy_rate?: number
          id?: string
          league_group_id?: string
          season_id?: string
          tier?: number
          updated_at?: string
          user_id?: string
          weekly_xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "league_memberships_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "league_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      league_seasons: {
        Row: {
          ends_at: string
          id: string
          starts_at: string
        }
        Insert: {
          ends_at: string
          id: string
          starts_at: string
        }
        Update: {
          ends_at?: string
          id?: string
          starts_at?: string
        }
        Relationships: []
      }
      learning_path_enrollments: {
        Row: {
          enrolled_at: string | null
          id: string
          learning_path_id: string
          progress: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          enrolled_at?: string | null
          id?: string
          learning_path_id: string
          progress?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          enrolled_at?: string | null
          id?: string
          learning_path_id?: string
          progress?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_enrollments_learning_path_id_fkey"
            columns: ["learning_path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          color: string
          created_at: string | null
          description: string
          duration: string
          enrolled_count: number
          icon: string
          id: string
          level: string
          modules: number
          rating: number
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          description: string
          duration: string
          enrolled_count?: number
          icon?: string
          id?: string
          level: string
          modules?: number
          rating?: number
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string
          duration?: string
          enrolled_count?: number
          icon?: string
          id?: string
          level?: string
          modules?: number
          rating?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      login_email_events: {
        Row: {
          id: string
          sent_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          sent_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          sent_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          cls: number | null
          fid_ms: number | null
          id: string
          lcp_ms: number | null
          path: string
          recorded_at: string | null
          user_id: string | null
        }
        Insert: {
          cls?: number | null
          fid_ms?: number | null
          id?: string
          lcp_ms?: number | null
          path: string
          recorded_at?: string | null
          user_id?: string | null
        }
        Update: {
          cls?: number | null
          fid_ms?: number | null
          id?: string
          lcp_ms?: number | null
          path?: string
          recorded_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          custom_theme: Json | null
          email: string
          full_name: string | null
          id: string
          lifetime_xp: number | null
          onboarding_state: Json | null
          stripe_customer_id: string | null
          study_preferences: Json | null
          subscription_renews_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          custom_theme?: Json | null
          email: string
          full_name?: string | null
          id: string
          lifetime_xp?: number | null
          onboarding_state?: Json | null
          stripe_customer_id?: string | null
          study_preferences?: Json | null
          subscription_renews_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          custom_theme?: Json | null
          email?: string
          full_name?: string | null
          id?: string
          lifetime_xp?: number | null
          onboarding_state?: Json | null
          stripe_customer_id?: string | null
          study_preferences?: Json | null
          subscription_renews_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          description: string | null
          version: string
        }
        Insert: {
          applied_at?: string | null
          description?: string | null
          version: string
        }
        Update: {
          applied_at?: string | null
          description?: string | null
          version?: string
        }
        Relationships: []
      }
      shared_decks: {
        Row: {
          accepted: boolean | null
          accepted_by: string | null
          created_at: string | null
          deck_id: string
          id: string
          owner_id: string
          share_token: string
          shared_with_email: string
          updated_at: string | null
        }
        Insert: {
          accepted?: boolean | null
          accepted_by?: string | null
          created_at?: string | null
          deck_id: string
          id?: string
          owner_id: string
          share_token?: string
          shared_with_email: string
          updated_at?: string | null
        }
        Update: {
          accepted?: boolean | null
          accepted_by?: string | null
          created_at?: string | null
          deck_id?: string
          id?: string
          owner_id?: string
          share_token?: string
          shared_with_email?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_decks_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          customer_id: string
          deleted_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          deleted_at?: string | null
          id?: never
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          deleted_at?: string | null
          id?: never
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_orders: {
        Row: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at: string | null
          currency: string
          customer_id: string
          deleted_at: string | null
          id: number
          payment_intent_id: string
          payment_status: string
          status: Database["public"]["Enums"]["stripe_order_status"]
          updated_at: string | null
        }
        Insert: {
          amount_subtotal: number
          amount_total: number
          checkout_session_id: string
          created_at?: string | null
          currency: string
          customer_id: string
          deleted_at?: string | null
          id?: never
          payment_intent_id: string
          payment_status: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Update: {
          amount_subtotal?: number
          amount_total?: number
          checkout_session_id?: string
          created_at?: string | null
          currency?: string
          customer_id?: string
          deleted_at?: string | null
          id?: never
          payment_intent_id?: string
          payment_status?: string
          status?: Database["public"]["Enums"]["stripe_order_status"]
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: number | null
          current_period_start: number | null
          customer_id: string
          deleted_at: string | null
          id: number
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id: string
          deleted_at?: string | null
          id?: never
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: number | null
          current_period_start?: number | null
          customer_id?: string
          deleted_at?: string | null
          id?: never
          payment_method_brand?: string | null
          payment_method_last4?: string | null
          price_id?: string | null
          status?: Database["public"]["Enums"]["stripe_subscription_status"]
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          accuracy: number | null
          cards_correct: number | null
          cards_reviewed: number | null
          cards_studied: number | null
          correct_answers: number | null
          deck_id: string | null
          duration_ms: number | null
          ended_at: string | null
          id: string
          started_at: string | null
          total_answers: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          cards_correct?: number | null
          cards_reviewed?: number | null
          cards_studied?: number | null
          correct_answers?: number | null
          deck_id?: string | null
          duration_ms?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          total_answers?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          cards_correct?: number | null
          cards_reviewed?: number | null
          cards_studied?: number | null
          correct_answers?: number | null
          deck_id?: string | null
          duration_ms?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          total_answers?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_fsrs_params: {
        Row: {
          accuracy_baseline: number
          last_tuned_at: string | null
          loss_value: number
          profile_label: string | null
          review_count: number
          tuning_runs: number
          user_id: string
          weights: Json
        }
        Insert: {
          accuracy_baseline?: number
          last_tuned_at?: string | null
          loss_value?: number
          profile_label?: string | null
          review_count?: number
          tuning_runs?: number
          user_id: string
          weights: Json
        }
        Update: {
          accuracy_baseline?: number
          last_tuned_at?: string | null
          loss_value?: number
          profile_label?: string | null
          review_count?: number
          tuning_runs?: number
          user_id?: string
          weights?: Json
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          cards_studied: number
          decks_created: number
          email: string | null
          full_name: string | null
          id: string
          last_active: string | null
          last_study_date: string | null
          level: number
          plan_tier: string | null
          sessions_completed: number
          streak: number | null
          streak_days: number
          study_preferences: Json | null
          theme_preference: string | null
          title: string | null
          user_id: string | null
          xp: number
        }
        Insert: {
          cards_studied?: number
          decks_created?: number
          email?: string | null
          full_name?: string | null
          id?: string
          last_active?: string | null
          last_study_date?: string | null
          level?: number
          plan_tier?: string | null
          sessions_completed?: number
          streak?: number | null
          streak_days?: number
          study_preferences?: Json | null
          theme_preference?: string | null
          title?: string | null
          user_id?: string | null
          xp?: number
        }
        Update: {
          cards_studied?: number
          decks_created?: number
          email?: string | null
          full_name?: string | null
          id?: string
          last_active?: string | null
          last_study_date?: string | null
          level?: number
          plan_tier?: string | null
          sessions_completed?: number
          streak?: number | null
          streak_days?: number
          study_preferences?: Json | null
          theme_preference?: string | null
          title?: string | null
          user_id?: string | null
          xp?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      welcome_email_events: {
        Row: {
          email: string
          id: string
          kind: string
          message_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          email: string
          id?: string
          kind: string
          message_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          email?: string
          id?: string
          kind?: string
          message_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      card_analytics: {
        Row: {
          answer: string | null
          card_stage: string | null
          deck_id: string | null
          ease_factor: number | null
          fsrs_state: Json | null
          id: string | null
          interval: number | null
          last_reviewed: string | null
          question: string | null
          repetition: number | null
          review_status: string | null
          source_type: string | null
          srs_algorithm: string | null
          trust_score: number | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          answer?: string | null
          card_stage?: never
          deck_id?: string | null
          ease_factor?: number | null
          fsrs_state?: Json | null
          id?: string | null
          interval?: number | null
          last_reviewed?: string | null
          question?: string | null
          repetition?: number | null
          review_status?: never
          source_type?: string | null
          srs_algorithm?: never
          trust_score?: number | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          answer?: string | null
          card_stage?: never
          deck_id?: string | null
          ease_factor?: number | null
          fsrs_state?: Json | null
          id?: string | null
          interval?: number | null
          last_reviewed?: string | null
          question?: string | null
          repetition?: number | null
          review_status?: never
          source_type?: string | null
          srs_algorithm?: never
          trust_score?: number | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_user_orders: {
        Row: {
          amount_subtotal: number | null
          amount_total: number | null
          checkout_session_id: string | null
          currency: string | null
          customer_id: string | null
          order_date: string | null
          order_id: number | null
          order_status:
            | Database["public"]["Enums"]["stripe_order_status"]
            | null
          payment_intent_id: string | null
          payment_status: string | null
        }
        Relationships: []
      }
      stripe_user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          current_period_end: number | null
          current_period_start: number | null
          customer_id: string | null
          payment_method_brand: string | null
          payment_method_last4: string | null
          price_id: string | null
          subscription_id: string | null
          subscription_status:
            | Database["public"]["Enums"]["stripe_subscription_status"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      bump_forks_and_unpublish: {
        Args: { p_deck_id: string; p_unpublish?: boolean }
        Returns: undefined
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      count_user_lapses: { Args: { p_user_id: string }; Returns: number }
      deactivate_admin: { Args: { target_user: string }; Returns: string }
      execute_sql: { Args: { query_text: string }; Returns: Json }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_enrolled_count: {
        Args: { path_id: string }
        Returns: undefined
      }
      increment_weekly_xp: {
        Args: {
          p_accuracy: number
          p_group_id: string
          p_tier: number
          p_user_id: string
          p_xp_delta: number
        }
        Returns: {
          accuracy_rate: number
          group_id: string
          tier: number
          weekly_xp: number
        }[]
      }
      is_admin: { Args: { user_uuid: string }; Returns: boolean }
      is_super_admin: { Args: { user_uuid: string }; Returns: boolean }
      promote_admin: {
        Args: { new_role: string; target_user: string }
        Returns: string
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
      upsert_user_fsrs_params: {
        Args: {
          p_accuracy_baseline: number
          p_loss_value: number
          p_profile_label: string
          p_review_count: number
          p_user_id: string
          p_weights: Json
        }
        Returns: undefined
      }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      stripe_order_status: "pending" | "completed" | "canceled"
      stripe_subscription_status:
        | "not_started"
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
  public: {
    Enums: {
      stripe_order_status: ["pending", "completed", "canceled"],
      stripe_subscription_status: [
        "not_started",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
