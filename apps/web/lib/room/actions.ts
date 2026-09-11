"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createRoomSchema,
  joinRoomSchema,
  type CreateRoomInput,
  type JoinRoomInput,
} from "@pairly/validation";
import type { RoomRow, ProfileRow } from "@pairly/database";

export type RoomActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  roomId?: string;
  code?: string;
  name?: string;
  alreadyMember?: boolean;
};

export type UserRoomSummary = {
  id: string;
  code: string;
  name: string;
  status: string;
  role: "owner" | "partner";
  joined_at: string;
  partner?: ProfileRow | null;
  member_count: number;
};

/**
 * Create a new private Pairly room and assign creator as 'owner'.
 */
export async function createRoomAction(
  input: CreateRoomInput
): Promise<RoomActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Kamu harus masuk terlebih dahulu." };
  }

  const validation = createRoomSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Nama room tidak valid.",
    };
  }

  const { name, description } = validation.data;

  // Call the atomic database RPC create_room
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("create_room", {
    p_name: name,
    p_description: description || null,
  });

  if (error || !data) {
    return {
      success: false,
      error: "Gagal membuat room. Silakan coba kembali.",
    };
  }

  const result = data as {
    success: boolean;
    error?: string;
    room_id?: string;
    code?: string;
    name?: string;
  };

  if (!result.success) {
    return {
      success: false,
      error: result.error || "Gagal membuat room.",
    };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Room Pairly berhasil dibuat!",
    roomId: result.room_id,
    code: result.code,
    name: result.name,
  };
}

// In-memory sliding-window rate limiter for room join attempts
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 5;
const COOLDOWN_DURATION_MS = 2 * 60 * 1000; // 2 minutes

type RateLimitRecord = {
  attempts: number[];
  blockedUntil?: number;
};

const joinRateLimitMap = new Map<string, RateLimitRecord>();

function checkJoinRateLimit(key: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const record = joinRateLimitMap.get(key);

  if (!record) {
    return { allowed: true };
  }

  if (record.blockedUntil && now < record.blockedUntil) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  // Filter out attempts outside sliding window
  record.attempts = record.attempts.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (record.attempts.length >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + COOLDOWN_DURATION_MS;
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(COOLDOWN_DURATION_MS / 1000),
    };
  }

  return { allowed: true };
}

function recordFailedJoinAttempt(key: string) {
  const now = Date.now();
  const record = joinRateLimitMap.get(key) || { attempts: [] };
  record.attempts.push(now);
  joinRateLimitMap.set(key, record);
}

function clearJoinRateLimit(key: string) {
  joinRateLimitMap.delete(key);
}

/**
 * Join an existing private Pairly room using a 6-character room code.
 * Concurrency-safe & enforces strictly max 2 members per room.
 * Protected with sliding-window brute-force rate limiting.
 */
export async function joinRoomAction(input: JoinRoomInput): Promise<RoomActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Kamu harus masuk terlebih dahulu." };
  }

  // Check rate limit per user
  const rateLimit = checkJoinRateLimit(user.id);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Terlalu banyak percobaan kode room yang salah. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
    };
  }

  const validation = joinRoomSchema.safeParse(input);
  if (!validation.success) {
    recordFailedJoinAttempt(user.id);
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Kode room tidak valid.",
    };
  }

  const { code } = validation.data;
  const normalizedCode = code.toUpperCase().trim();

  // Call the concurrency-safe transactional RPC join_room_by_code
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("join_room_by_code", {
    p_code: normalizedCode,
  });

  if (error || !data) {
    recordFailedJoinAttempt(user.id);
    return {
      success: false,
      error: "Gagal memproses permintaan bergabung ke room.",
    };
  }

  const result = data as {
    success: boolean;
    error?: string;
    room_id?: string;
    code?: string;
    name?: string;
    already_member?: boolean;
  };

  if (!result.success) {
    recordFailedJoinAttempt(user.id);
    return {
      success: false,
      error: result.error || "Gagal bergabung ke room.",
    };
  }

  // Clear rate limit on successful join
  clearJoinRateLimit(user.id);

  revalidatePath("/dashboard");

  return {
    success: true,
    message: result.already_member
      ? "Kamu sudah menjadi anggota room ini!"
      : "Berhasil terhubung ke room pasangan!",
    roomId: result.room_id,
    code: result.code,
    name: result.name,
    alreadyMember: result.already_member,
  };
}

/**
 * Leave a room. Removes membership and updates room status if empty.
 */
export async function leaveRoomAction(roomId: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Kamu harus masuk terlebih dahulu." };
  }

  // 1. Delete membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = (await supabase
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", user.id)) as any;

  if (deleteError) {
    return {
      success: false,
      error: "Gagal keluar dari room. Silakan coba kembali.",
    };
  }

  // 2. Check remaining members count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: remainingMembers } = (await supabase
    .from("room_members")
    .select("id")
    .eq("room_id", roomId)) as any;

  if (!remainingMembers || remainingMembers.length === 0) {
    // If no members remain, mark room status as inactive
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("rooms") as any).update({ status: "inactive" }).eq("id", roomId);
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Kamu telah berhasil keluar dari room.",
  };
}

/**
 * Fetch all rooms the authenticated user belongs to, including partner profiles.
 */
export async function getUserRoomsAction(): Promise<{
  success: boolean;
  rooms: UserRoomSummary[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, rooms: [], error: "Kamu belum masuk." };
  }

  // 1. Get memberships for this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: userMemberships, error: memberError } = (await supabase
    .from("room_members")
    .select("room_id, role, joined_at")
    .eq("user_id", user.id)) as any;

  if (memberError || !userMemberships || userMemberships.length === 0) {
    return { success: true, rooms: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roomIds = userMemberships.map((m: any) => m.room_id);

  // 2. Fetch room details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roomsData, error: roomsError } = (await supabase
    .from("rooms")
    .select("*")
    .in("id", roomIds)
    .order("created_at", { ascending: false })) as any;

  if (roomsError || !roomsData) {
    return { success: false, rooms: [], error: "Gagal mengambil daftar room." };
  }

  // 3. Fetch all members of these rooms to find partners and count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allMembers } = (await supabase
    .from("room_members")
    .select("room_id, user_id, role")
    .in("room_id", roomIds)) as any;

  // Fetch partner profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partnerUserIds = (allMembers || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((m: any) => m.user_id !== user.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => m.user_id);

  let profilesMap = new Map<string, ProfileRow>();
  if (partnerUserIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: partnerProfiles } = (await supabase
      .from("profiles")
      .select("*")
      .in("id", partnerUserIds)) as any;

    if (partnerProfiles) {
      partnerProfiles.forEach((p: ProfileRow) => profilesMap.set(p.id, p));
    }
  }

  // Map into UserRoomSummary
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summaries: UserRoomSummary[] = roomsData.map((room: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const membership = userMemberships.find((m: any) => m.room_id === room.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomMembers = (allMembers || []).filter((m: any) => m.room_id === room.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partnerMember = roomMembers.find((m: any) => m.user_id !== user.id);
    const partnerProfile = partnerMember
      ? profilesMap.get(partnerMember.user_id) || null
      : null;

    return {
      id: room.id,
      code: room.code,
      name: room.name,
      status: room.status,
      role: (membership?.role as "owner" | "partner") || "partner",
      joined_at: membership?.joined_at || room.created_at,
      partner: partnerProfile,
      member_count: Math.max(roomMembers.length, 1),
    };
  });

  return { success: true, rooms: summaries };
}

/**
 * Fetch a specific room by code and verify authenticated user membership.
 */
export async function getRoomDetailsAction(code: string): Promise<{
  success: boolean;
  room?: RoomRow;
  members?: {
    id: string;
    user_id: string;
    role: string;
    profile: ProfileRow;
  }[];
  partner?: ProfileRow | null;
  error?: string;
  isOwner?: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Kamu harus masuk terlebih dahulu." };
  }

  const normalizedCode = code.toUpperCase().trim();

  // 1. Fetch room by code (RLS will only allow if user is created_by or verified member)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: room, error: roomError } = (await supabase
    .from("rooms")
    .select("*")
    .eq("code", normalizedCode)
    .maybeSingle()) as any;

  if (roomError || !room) {
    return {
      success: false,
      error: "Room tidak ditemukan atau kamu tidak memiliki akses.",
    };
  }

  // 2. Fetch room members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members, error: membersError } = (await supabase
    .from("room_members")
    .select("id, user_id, role, joined_at")
    .eq("room_id", room.id)) as any;

  if (membersError || !members) {
    return {
      success: false,
      error: "Gagal memuat data anggota room.",
    };
  }

  // 3. Verify that the current user is actually one of the members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentMember = members.find((m: any) => m.user_id === user.id);
  if (!currentMember) {
    return {
      success: false,
      error: "Kamu bukan anggota dari room privat ini.",
    };
  }

  // 4. Fetch profiles of all members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userIds = members.map((m: any) => m.user_id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = (await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds)) as any;

  let profilesMap = new Map<string, ProfileRow>();
  if (profiles) {
    profiles.forEach((p: ProfileRow) => profilesMap.set(p.id, p));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrichedMembers = members.map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role as "owner" | "partner",
    profile: profilesMap.get(m.user_id)!,
  }));

  const partnerMember = enrichedMembers.find((m: any) => m.user_id !== user.id);

  return {
    success: true,
    room: room as RoomRow,
    members: enrichedMembers,
    partner: partnerMember ? partnerMember.profile : null,
    isOwner: currentMember.role === "owner" || room.created_by === user.id,
  };
}
