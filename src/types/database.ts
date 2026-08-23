export type BusinessStatus = "active" | "inactive" | "suspended";
export type MembershipRole = "owner" | "staff";
export type MembershipStatus = "active" | "inactive";
export type PlatformRole = "meridian_admin";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "suggested";
export type BookingMode = "meridian" | "external" | "hybrid";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: BusinessStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: BusinessStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          status?: BusinessStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          platform_role: PlatformRole | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          platform_role?: PlatformRole | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          platform_role?: PlatformRole | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_memberships: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: MembershipRole;
          status: MembershipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          user_id: string;
          role?: MembershipRole;
          status?: MembershipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          user_id?: string;
          role?: MembershipRole;
          status?: MembershipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_memberships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_settings: {
        Row: {
          id: string;
          business_id: string;
          notification_email: string;
          timezone: string;
          booking_mode: BookingMode;
          external_booking_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          notification_email: string;
          timezone?: string;
          booking_mode?: BookingMode;
          external_booking_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          notification_email?: string;
          timezone?: string;
          booking_mode?: BookingMode;
          external_booking_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_settings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          duration_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          business_id: string;
          service_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string | null;
          preferred_date: string;
          preferred_time: string;
          guest_count: number | null;
          notes: string | null;
          status: BookingStatus;
          suggested_date: string | null;
          suggested_time: string | null;
          privacy_consent_at: string | null;
          confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          service_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone?: string | null;
          preferred_date: string;
          preferred_time: string;
          guest_count?: number | null;
          notes?: string | null;
          status?: BookingStatus;
          suggested_date?: string | null;
          suggested_time?: string | null;
          privacy_consent_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          service_id?: string | null;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string | null;
          preferred_date?: string;
          preferred_time?: string;
          guest_count?: number | null;
          notes?: string | null;
          status?: BookingStatus;
          suggested_date?: string | null;
          suggested_time?: string | null;
          privacy_consent_at?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_events: {
        Row: {
          id: string;
          business_id: string;
          booking_id: string;
          event_type: string;
          actor_user_id: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          booking_id: string;
          event_type: string;
          actor_user_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          booking_id?: string;
          event_type?: string;
          actor_user_id?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_events_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_meridian_admin: { Args: Record<string, never>; Returns: boolean };
      has_active_business_membership: {
        Args: { p_business_id: string };
        Returns: boolean;
      };
      is_business_owner: {
        Args: { p_business_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      business_status: BusinessStatus;
      membership_role: MembershipRole;
      membership_status: MembershipStatus;
      platform_role: PlatformRole;
      booking_status: BookingStatus;
      booking_mode: BookingMode;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
