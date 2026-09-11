import type {
  Profile,
  Room,
  RoomMember,
  Activity,
  ActivitySession,
  ActivityEvent,
  Memory,
  MemoryMedia,
  Notification,
  Report,
} from "@pairly/types";

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
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Room>;
      };
      room_members: {
        Row: RoomMember;
        Insert: Omit<RoomMember, "id" | "joined_at"> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<RoomMember>;
      };
      activities: {
        Row: Activity;
        Insert: Omit<Activity, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Activity>;
      };
      activity_sessions: {
        Row: ActivitySession;
        Insert: Omit<ActivitySession, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ActivitySession>;
      };
      activity_events: {
        Row: ActivityEvent;
        Insert: Omit<ActivityEvent, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ActivityEvent>;
      };
      memories: {
        Row: Memory;
        Insert: Omit<Memory, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Memory>;
      };
      memory_media: {
        Row: MemoryMedia;
        Insert: Omit<MemoryMedia, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<MemoryMedia>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Notification>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Report>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
