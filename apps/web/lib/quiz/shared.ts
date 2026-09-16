import type { ActivitySessionRow } from "@pairly/database";

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
