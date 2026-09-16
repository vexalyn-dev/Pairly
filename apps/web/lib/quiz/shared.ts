import type { ActivitySessionRow } from "@pairly/database";

export type CouplesQuizQuestion = {
  id: string;
  prompt: string;
  hint: string;
};

export type CouplesQuizPhase = "original" | "guess";
export type CouplesQuizAnswersByUser = Record<string, Record<string, string>>;

export type CouplesQuizState = {
  started_by?: string;
  started_at?: string;
  answers?: {
    original?: CouplesQuizAnswersByUser;
    guess?: CouplesQuizAnswersByUser;
  };
  result?: {
    score: number;
    matches: number;
    total: number;
    rounds?: Record<string, { matches: number; total: number }>;
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
    prompt: "Makanan apa yang paling bikin kamu merasa disayang?",
    hint: "Isi jawaban aslimu dulu. Nanti pasanganmu akan menebak.",
  },
  {
    id: "perfect-date",
    prompt: "Date sederhana seperti apa yang paling kamu suka?",
    hint: "Pikirkan vibe, bukan harga.",
  },
  {
    id: "love-language",
    prompt: "Love language apa yang paling terasa buat kamu?",
    hint: "Quality time, words, touch, help, gifts — atau versi kamu sendiri.",
  },
  {
    id: "stress-reset",
    prompt: "Kalau kamu stres, hal kecil apa yang paling membantu?",
    hint: "Jawaban paling jujur biasanya paling mudah ditebak.",
  },
  {
    id: "sweet-memory",
    prompt: "Momen kecil apa yang paling manis dari kalian buat kamu?",
    hint: "Boleh spesifik, boleh satu kalimat.",
  },
];
