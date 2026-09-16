"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  couplesQuizSessionSchema,
  submitCouplesQuizAnswerSchema,
  type CouplesQuizSessionInput,
  type SubmitCouplesQuizAnswerInput,
} from "@pairly/validation";
import type { ActivitySessionRow } from "@pairly/database";

export type CouplesQuizActionResult = {
  success: boolean;
  error?: string;
  state?: CouplesQuizState;
  session?: CouplesQuizSession;
};

export type CouplesQuizQuestion = {
  id: string;
  prompt: string;
  hint: string;
};

export type CouplesQuizState = {
  started_by?: string;
  started_at?: string;
  question_index?: number;
  answers?: Record<string, Record<string, string>>;
  result?: {
    score: number;
    matches: number;
    total: number;
    finished_by: string;
    finished_at: string;
  };
};

export type CouplesQuizSession = ActivitySessionRow & {
  room?: { id: string; code: string; name: string } | null;
};

export const COUPLES_QUIZ_QUESTIONS: CouplesQuizQuestion[] = [
  {
    id: "comfort-food",
    prompt: "Makanan apa yang paling bikin pasanganmu merasa disayang?",
    hint: "Jawab singkat. Contoh: ramen pedas, es krim stroberi.",
  },
  {
    id: "perfect-date",
    prompt: "Date sederhana seperti apa yang paling pasanganmu suka?",
    hint: "Pikirkan vibe, bukan harga.",
  },
  {
    id: "love-language",
    prompt: "Love language pasanganmu paling terasa lewat apa?",
    hint: "Quality time, words, touch, help, gifts — atau versi kalian sendiri.",
  },
  {
    id: "stress-reset",
    prompt: "Kalau pasanganmu stres, hal kecil apa yang paling membantu?",
    hint: "Jawaban paling jujur biasanya menang.",
  },
  {
    id: "sweet-memory",
    prompt: "Momen kecil apa yang menurut pasanganmu paling manis dari kalian?",
    hint: "Boleh spesifik, boleh satu kalimat.",
  },
];

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

function parseRpcState(data: unknown): CouplesQuizState | undefined {
  const result = data as { state?: CouplesQuizState } | null;
  return result?.state;
}

export async function getCouplesQuizSessionAction(
  input: CouplesQuizSessionInput
): Promise<CouplesQuizActionResult> {
  const validation = couplesQuizSessionSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Kamu belum masuk." };

  const { data, error } = await supabase
    .from("activity_sessions")
    .select("*, room:rooms(id, code, name), activity:activities(slug)")
    .eq("id", validation.data.sessionId)
    .single();

  if (error || !data) return { success: false, error: "Sesi quiz tidak ditemukan." };

  const session = data as CouplesQuizSession & { activity?: { slug?: string } | null };
  if (session.activity?.slug !== "couples-quiz") {
    return { success: false, error: "Sesi ini bukan Couples Quiz." };
  }

  return {
    success: true,
    session,
    state: (session.state || {}) as CouplesQuizState,
  };
}

export async function startCouplesQuizAction(
  input: CouplesQuizSessionInput
): Promise<CouplesQuizActionResult> {
  const validation = couplesQuizSessionSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Kamu harus masuk terlebih dahulu." };

  const { data, error } = await (supabase.rpc as any)("start_couples_quiz", {
    p_session_id: validation.data.sessionId,
  });

  if (error || !data) return { success: false, error: "Gagal memulai quiz." };

  const result = data as { success: boolean; error?: string };
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/dashboard");
  return { success: true, state: parseRpcState(data) };
}

export async function submitCouplesQuizAnswerAction(
  input: SubmitCouplesQuizAnswerInput
): Promise<CouplesQuizActionResult> {
  const validation = submitCouplesQuizAnswerSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Kamu harus masuk terlebih dahulu." };

  const { sessionId, questionId, answer } = validation.data;
  const { data, error } = await (supabase.rpc as any)("submit_couples_quiz_answer", {
    p_session_id: sessionId,
    p_question_id: questionId,
    p_answer: answer,
  });

  if (error || !data) return { success: false, error: "Gagal mengirim jawaban." };

  const result = data as { success: boolean; error?: string };
  if (!result.success) return { success: false, error: result.error };

  return { success: true, state: parseRpcState(data) };
}

export async function finishCouplesQuizAction(
  input: CouplesQuizSessionInput
): Promise<CouplesQuizActionResult> {
  const validation = couplesQuizSessionSchema.safeParse(input);
  if (!validation.success) {
    return { success: false, error: validation.error.errors[0]?.message };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { success: false, error: "Kamu harus masuk terlebih dahulu." };

  const { data, error } = await (supabase.rpc as any)("finish_couples_quiz", {
    p_session_id: validation.data.sessionId,
  });

  if (error || !data) return { success: false, error: "Gagal menyelesaikan quiz." };

  const result = data as { success: boolean; error?: string };
  if (!result.success) return { success: false, error: result.error };

  revalidatePath("/dashboard");
  return { success: true, state: parseRpcState(data) };
}
