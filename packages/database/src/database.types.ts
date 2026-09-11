export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          code: string;
          name: string;
          created_by: string;
          status: "active" | "archived" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code?: string;
          name: string;
          created_by: string;
          status?: "active" | "archived" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          created_by?: string;
          status?: "active" | "archived" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      room_members: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          role: "owner" | "partner";
          nickname: string | null;
          joined_at: string;
          last_seen_at: string | null;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          role?: "owner" | "partner";
          nickname?: string | null;
          joined_at?: string;
          last_seen_at?: string | null;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          role?: "owner" | "partner";
          nickname?: string | null;
          joined_at?: string;
          last_seen_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "room_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      activities: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          category: "game" | "quiz" | "canvas" | "moment" | "watch";
          is_active: boolean;
          is_premium: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          category: "game" | "quiz" | "canvas" | "moment" | "watch";
          is_active?: boolean;
          is_premium?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          category?: "game" | "quiz" | "canvas" | "moment" | "watch";
          is_active?: boolean;
          is_premium?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      activity_sessions: {
        Row: {
          id: string;
          room_id: string;
          activity_id: string;
          status: "waiting" | "in_progress" | "completed" | "abandoned" | "cancelled";
          state: Json;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          activity_id: string;
          status?: "waiting" | "in_progress" | "completed" | "abandoned" | "cancelled";
          state?: Json;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          activity_id?: string;
          status?: "waiting" | "in_progress" | "completed" | "abandoned" | "cancelled";
          state?: Json;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_sessions_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_sessions_activity_id_fkey";
            columns: ["activity_id"];
            isOneToOne: false;
            referencedRelation: "activities";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_events: {
        Row: {
          id: number;
          session_id: string;
          user_id: string;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: never;
          session_id: string;
          user_id: string;
          event_type: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: never;
          session_id?: string;
          user_id?: string;
          event_type?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_events_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "activity_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      memories: {
        Row: {
          id: string;
          room_id: string;
          created_by: string;
          title: string;
          description: string | null;
          memory_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          memory_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          memory_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memories_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "memories_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      memory_media: {
        Row: {
          id: string;
          memory_id: string;
          storage_path: string;
          media_type: "image" | "video" | "audio";
          mime_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          memory_id: string;
          storage_path: string;
          media_type: "image" | "video" | "audio";
          mime_type: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          memory_id?: string;
          storage_path?: string;
          media_type?: "image" | "video" | "audio";
          mime_type?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memory_media_memory_id_fkey";
            columns: ["memory_id"];
            isOneToOne: false;
            referencedRelation: "memories";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "room_invite"
            | "activity_start"
            | "memory_added"
            | "reaction"
            | "partner_joined"
            | "system";
          title: string;
          message: string;
          data: Json;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "room_invite"
            | "activity_start"
            | "memory_added"
            | "reaction"
            | "partner_joined"
            | "system";
          title: string;
          message: string;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "room_invite"
            | "activity_start"
            | "memory_added"
            | "reaction"
            | "partner_joined"
            | "system";
          title?: string;
          message?: string;
          data?: Json;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          room_id: string | null;
          target_user_id: string | null;
          reason: string;
          description: string | null;
          status: "pending" | "reviewing" | "resolved" | "dismissed";
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          room_id?: string | null;
          target_user_id?: string | null;
          reason: string;
          description?: string | null;
          status?: "pending" | "reviewing" | "resolved" | "dismissed";
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          room_id?: string | null;
          target_user_id?: string | null;
          reason?: string;
          description?: string | null;
          status?: "pending" | "reviewing" | "resolved" | "dismissed";
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_room_code: {
        Args: { p_length?: number };
        Returns: string;
      };
      is_room_member: {
        Args: { p_room_id: string; p_user_id?: string };
        Returns: boolean;
      };
      is_room_owner: {
        Args: { p_room_id: string; p_user_id?: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
