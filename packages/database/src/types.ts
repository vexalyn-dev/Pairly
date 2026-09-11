import type { Database as DatabaseGenerated } from "./database.types";

export type Database = Omit<DatabaseGenerated, "__InternalSupabase">;
export type { Json } from "./database.types";

// Convenient helper type aliases for Pairly tables
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Specific Pairly entity row types inferred from Database
export type ProfileRow = Tables<"profiles">;
export type RoomRow = Tables<"rooms">;
export type RoomMemberRow = Tables<"room_members">;
export type ActivityRow = Tables<"activities">;
export type ActivitySessionRow = Tables<"activity_sessions">;
export type ActivityEventRow = Tables<"activity_events">;
export type MemoryRow = Tables<"memories">;
export type MemoryMediaRow = Tables<"memory_media">;
export type NotificationRow = Tables<"notifications">;
export type ReportRow = Tables<"reports">;
