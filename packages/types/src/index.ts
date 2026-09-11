// ==========================================
// PAIRLY CORE DATABASE ENTITIES
// ==========================================

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export type RoomStatus = "active" | "archived" | "closed";

export interface Room {
  id: string;
  code: string; // 6-char unique identifier
  name: string;
  created_by: string;
  status: RoomStatus;
  created_at: string;
  updated_at: string;
}

export type RoomRole = "owner" | "partner";

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: RoomRole;
  nickname: string | null;
  joined_at: string;
  last_seen_at: string | null;
  profile?: Profile;
}

export type ActivityCategory = "game" | "quiz" | "canvas" | "moment" | "watch";

export interface Activity {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  category: ActivityCategory;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
}

export type SessionStatus = "waiting" | "in_progress" | "completed" | "abandoned";

export interface ActivitySession {
  id: string;
  room_id: string;
  activity_id: string;
  status: SessionStatus;
  state: Record<string, unknown>;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  activity?: Activity;
}

export interface ActivityEvent {
  id: string;
  session_id: string;
  user_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Memory {
  id: string;
  room_id: string;
  created_by: string;
  title: string;
  description: string | null;
  memory_date: string;
  created_at: string;
  updated_at: string;
  media?: MemoryMedia[];
}

export type MediaType = "image" | "video" | "audio";

export interface MemoryMedia {
  id: string;
  memory_id: string;
  storage_path: string;
  media_type: MediaType;
  mime_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export type NotificationType =
  "room_invite" | "activity_start" | "memory_added" | "reaction";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporter_id: string;
  room_id: string | null;
  target_user_id: string | null;
  reason: string;
  description: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
}

// ==========================================
// EPHEMERAL REALTIME STATE (NOT SAVED TO DB)
// ==========================================

export interface CursorPosition {
  x: number; // percentage (0-100) or normalized
  y: number; // percentage (0-100) or normalized
  last_updated: number;
}

export interface TypingState {
  is_typing: boolean;
  user_id: string;
}

export interface PresenceState {
  user_id: string;
  online_at: string;
  cursor?: CursorPosition;
  is_typing?: boolean;
}

export interface LiveReaction {
  id: string;
  user_id: string;
  emoji: string;
  x: number;
  y: number;
  created_at: number;
}
