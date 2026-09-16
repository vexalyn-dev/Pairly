"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  appendActivityEventSchema,
  finishActivitySessionSchema,
  startActivitySessionSchema,
  type AppendActivityEventInput,
  type FinishActivitySessionInput,
  type StartActivitySessionInput,
} from "@pairly/validation";
import type { ActivityRow, ActivitySessionRow, Json } from "@pairly/database";

export type ActivityActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export type ActivitySessionSummary = ActivitySessionRow & {
  activity: Pick<ActivityRow, "slug" | "name" | "icon" | "category"> | null;
};

export type StartActivitySessionResult = ActivityActionResult & {
  sessionId?: string;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function getActivitiesAction(): Promise<{
  success: boolean;
  activities: ActivityRow[];
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { success: false, activities: [], error: "Kamu belum masuk." };
  }

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    return { success: false, activities: [], error: "Gagal memuat aktivitas." };
  }

  return { success: true, activities: (data || []) as ActivityRow[] };
}

export async function getRoomActivitySessionsAction(roomId: string): Promise<{
  success: boolean;
  sessions: ActivitySessionSummary[];
  error?: string;
}> {
  const { supabase, user } = await requireUser();

  if (!user) {
    return { success: false, sessions: [], error: "Kamu belum masuk." };
  }

  const { data, error } = await supabase
    .from("activity_sessions")
    .select("*, activity:activities(slug, name, icon, category)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    return { success: false, sessions: [], error: "Gagal memuat sesi aktivitas." };
  }

  return { success: true, sessions: (data || []) as ActivitySessionSummary[] };
}

export async function startActivitySessionAction(
  input: StartActivitySessionInput
): Promise<StartActivitySessionResult> {
  const validation = startActivitySessionSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Aktivitas tidak valid.",
    };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Kamu harus masuk terlebih dahulu." };
  }

  const { roomId, activitySlug } = validation.data;
  const { data, error } = await (supabase.rpc as any)("start_activity_session", {
    p_room_id: roomId,
    p_activity_slug: activitySlug,
  });

  if (error || !data) {
    return { success: false, error: "Gagal memulai aktivitas." };
  }

  const result = data as { success: boolean; error?: string; session_id?: string };
  if (!result.success) {
    return { success: false, error: result.error || "Gagal memulai aktivitas." };
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Aktivitas dimulai.",
    sessionId: result.session_id,
  };
}

export async function finishActivitySessionAction(
  input: FinishActivitySessionInput
): Promise<ActivityActionResult> {
  const validation = finishActivitySessionSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Sesi aktivitas tidak valid.",
    };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Kamu harus masuk terlebih dahulu." };
  }

  const { sessionId, status, state } = validation.data;
  const { data, error } = await (supabase.rpc as any)("finish_activity_session", {
    p_session_id: sessionId,
    p_status: status,
    p_state: (state || {}) as Json,
  });

  if (error || !data) {
    return { success: false, error: "Gagal mengakhiri sesi aktivitas." };
  }

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error || "Gagal mengakhiri sesi aktivitas." };
  }

  revalidatePath("/dashboard");
  return { success: true, message: "Sesi aktivitas diperbarui." };
}

export async function appendActivityEventAction(
  input: AppendActivityEventInput
): Promise<ActivityActionResult> {
  const validation = appendActivityEventSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Event aktivitas tidak valid.",
    };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Kamu harus masuk terlebih dahulu." };
  }

  const { sessionId, eventType, payload } = validation.data;
  const { data, error } = await (supabase.rpc as any)("append_activity_event", {
    p_session_id: sessionId,
    p_event_type: eventType,
    p_payload: (payload || {}) as Json,
  });

  if (error || !data) {
    return { success: false, error: "Gagal mencatat event aktivitas." };
  }

  const result = data as { success: boolean; error?: string };
  if (!result.success) {
    return { success: false, error: result.error || "Gagal mencatat event aktivitas." };
  }

  return { success: true, message: "Event aktivitas dicatat." };
}
