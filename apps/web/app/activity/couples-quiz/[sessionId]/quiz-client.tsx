"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Heart,
  Loader2,
  Lock,
  Radio,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Button } from "@pairly/ui";
import { createClient } from "@/lib/supabase/client";
import {
  finishCouplesQuizAction,
  startCouplesQuizAction,
  submitCouplesQuizAnswerAction,
} from "@/lib/quiz/actions";
import {
  COUPLES_QUIZ_QUESTIONS,
  type CouplesQuizPhase,
  type CouplesQuizSession,
  type CouplesQuizState,
} from "@/lib/quiz/shared";

interface CouplesQuizClientProps {
  currentUserId: string;
  session: CouplesQuizSession;
  initialState: CouplesQuizState;
}

const phaseCopy: Record<
  CouplesQuizPhase,
  { badge: string; title: string; placeholder: string }
> = {
  original: {
    badge: "Jawaban Asli",
    title: "Jawab buat dirimu sendiri dulu",
    placeholder: "Tulis jawaban aslimu...",
  },
  guess: {
    badge: "Tebakan",
    title: "Menurutmu, apa jawaban pasanganmu?",
    placeholder: "Tulis tebakanmu tentang pasangan...",
  },
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function CouplesQuizClient({
  currentUserId,
  session,
  initialState,
}: CouplesQuizClientProps) {
  const [state, setState] = React.useState<CouplesQuizState>(initialState);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<CouplesQuizPhase>("original");
  const [answer, setAnswer] = React.useState("");
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [presenceCount, setPresenceCount] = React.useState(1);

  const question = COUPLES_QUIZ_QUESTIONS[questionIndex];
  const originalAnswers = state.answers?.original || {};
  const guessAnswers = state.answers?.guess || {};
  const myOriginal = originalAnswers[currentUserId] || {};
  const myGuess = guessAnswers[currentUserId] || {};
  const savedAnswer =
    phase === "original" ? myOriginal[question.id] || "" : myGuess[question.id] || "";
  const answered = Boolean(savedAnswer);
  const partnerOriginalReady = Object.entries(originalAnswers).some(
    ([userId, answers]) => userId !== currentUserId && Boolean(answers[question.id])
  );
  const canGuess = Boolean(myOriginal[question.id]) && partnerOriginalReady;
  const isCompleted = Boolean(state.result) || session.status === "completed";
  const myDoneCount = COUPLES_QUIZ_QUESTIONS.reduce((total, item) => {
    return total + (myOriginal[item.id] ? 1 : 0) + (myGuess[item.id] ? 1 : 0);
  }, 0);
  const progress = Math.round((myDoneCount / (COUPLES_QUIZ_QUESTIONS.length * 2)) * 100);
  const players = Array.from(
    new Set([...Object.keys(originalAnswers), ...Object.keys(guessAnswers)])
  );
  const canFinish =
    players.length >= 2 &&
    COUPLES_QUIZ_QUESTIONS.every((item) =>
      players
        .slice(0, 2)
        .every(
          (userId) =>
            originalAnswers[userId]?.[item.id] && guessAnswers[userId]?.[item.id]
        )
    );

  React.useEffect(() => {
    setAnswer(savedAnswer);
  }, [savedAnswer, question.id, phase]);

  React.useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`pairly:activity:${session.id}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        setPresenceCount(Object.keys(channel.presenceState()).length);
      })
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "activity_sessions",
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const next = payload.new as { state?: CouplesQuizState };
          setState(next.state || {});
        }
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, session.id]);

  async function run(
    action: string,
    fn: () => Promise<{ success: boolean; error?: string; state?: CouplesQuizState }>
  ) {
    setPending(action);
    setError(null);
    const result = await fn();
    if (!result.success) setError(result.error || "Aksi gagal.");
    if (result.state) setState(result.state);
    setPending(null);
    return result;
  }

  async function handleSubmitAnswer() {
    const result = await run("answer", () =>
      submitCouplesQuizAnswerAction({
        sessionId: session.id,
        questionId: question.id,
        phase,
        answer,
      })
    );

    if (!result.success) return;
    if (phase === "original") {
      setPhase("guess");
      return;
    }
    setQuestionIndex((current) =>
      Math.min(current + 1, COUPLES_QUIZ_QUESTIONS.length - 1)
    );
    setPhase("original");
  }

  function nextQuestion() {
    setQuestionIndex((current) =>
      Math.min(current + 1, COUPLES_QUIZ_QUESTIONS.length - 1)
    );
    setPhase("original");
  }

  function previousQuestion() {
    setQuestionIndex((current) => Math.max(current - 1, 0));
    setPhase("original");
  }

  function selectQuestion(index: number) {
    setQuestionIndex(index);
    setPhase("original");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffe4ef,transparent_35%),linear-gradient(135deg,#fff7fb,#fff,#fff1f6)] px-6 py-8 text-slate-950">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(120deg,rgba(244,63,94,0.08),transparent,rgba(217,70,239,0.08))]" />
      <section className="relative mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href={session.room?.code ? `/room/${session.room.code}` : "/dashboard"}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-100 bg-white/80 px-4 py-2 text-xs font-bold text-slate-600 shadow-soft backdrop-blur hover:text-rose-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Room
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <Radio className="h-3.5 w-3.5" />
            {presenceCount} online
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-pink-100 bg-white/85 p-6 shadow-romantic backdrop-blur-xl sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-rose-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Couples Quiz
                </div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Seberapa kenal kalian?
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                  Jawab diri sendiri dulu, lalu tebak pasangan. Skor dihitung dari tebakan
                  yang cocok.
                </p>
              </div>
              <div className="hidden h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-rose-500 to-fuchsia-500 text-white shadow-romantic sm:flex">
                <Heart className="h-8 w-8 fill-current" />
              </div>
            </div>

            {!state.started_at && !isCompleted ? (
              <Button
                onClick={() =>
                  run("start", () => startCouplesQuizAction({ sessionId: session.id }))
                }
                disabled={Boolean(pending)}
                className="h-12 rounded-2xl bg-rose-500 px-6 font-bold text-white hover:bg-rose-600"
              >
                {pending === "start" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Mulai Quiz
              </Button>
            ) : isCompleted && state.result ? (
              <div className="rounded-3xl bg-gradient-to-br from-rose-500 to-fuchsia-600 p-6 text-white shadow-romantic">
                <Trophy className="mb-4 h-10 w-10" />
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/75">
                  Skor Chemistry
                </p>
                <p className="mt-2 text-6xl font-black">{state.result.score}%</p>
                <p className="mt-3 text-sm text-white/85">
                  {state.result.matches} dari {state.result.total} tebakan cocok.
                </p>
                <div className="mt-6 space-y-3">
                  {COUPLES_QUIZ_QUESTIONS.map((item) => {
                    const round = state.result?.rounds?.[item.id];
                    return (
                      <div key={item.id} className="rounded-2xl bg-white/15 p-4 text-sm">
                        <p className="font-black">{item.prompt}</p>
                        <p className="mt-1 text-white/80">
                          {round?.matches ?? 0}/{round?.total ?? 2} tebakan cocok.
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 h-3 overflow-hidden rounded-full bg-rose-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="rounded-3xl border border-rose-100 bg-gradient-to-br from-white to-rose-50/70 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-400">
                      Pertanyaan {questionIndex + 1}/{COUPLES_QUIZ_QUESTIONS.length}
                    </p>
                    <p className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                      {phaseCopy[phase].badge}
                    </p>
                  </div>
                  <h2 className="mt-3 text-2xl font-black text-slate-950">
                    {question.prompt}
                  </h2>
                  <p className="mt-2 text-sm font-bold text-slate-600">
                    {phaseCopy[phase].title}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {phase === "guess" && !canGuess
                      ? "Tunggu sampai kamu dan pasangan sama-sama mengisi jawaban asli."
                      : question.hint}
                  </p>

                  <textarea
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    maxLength={500}
                    rows={4}
                    disabled={phase === "guess" && !canGuess}
                    className="mt-5 w-full resize-none rounded-2xl border border-pink-100 bg-white/90 p-4 text-sm font-medium outline-none ring-rose-200 transition focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder={phaseCopy[phase].placeholder}
                  />

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={
                        Boolean(pending) ||
                        answer.trim().length === 0 ||
                        (phase === "guess" && !canGuess)
                      }
                      className="rounded-2xl bg-rose-500 px-5 font-bold text-white hover:bg-rose-600"
                    >
                      {pending === "answer" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {answered ? "Update" : "Kirim"} {phaseCopy[phase].badge}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={previousQuestion}
                      disabled={questionIndex === 0}
                    >
                      Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      onClick={nextQuestion}
                      disabled={questionIndex === COUPLES_QUIZ_QUESTIONS.length - 1}
                    >
                      Berikutnya
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}
          </div>

          <aside className="rounded-[2rem] border border-pink-100 bg-slate-950 p-6 text-white shadow-romantic">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-300">
              Live progress
            </p>
            <div className="mt-6 space-y-3">
              {COUPLES_QUIZ_QUESTIONS.map((item, index) => {
                const originalDone = Boolean(myOriginal[item.id]);
                const guessDone = Boolean(myGuess[item.id]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectQuestion(index)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      index === questionIndex
                        ? "border-rose-300 bg-white/15"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className="font-bold">
                      {index + 1}. {item.prompt}
                    </span>
                    <span className="flex gap-1">
                      {originalDone ? (
                        <Check className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <Lock className="h-4 w-4 text-white/30" />
                      )}
                      {guessDone ? <Check className="h-4 w-4 text-fuchsia-300" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>

            {!isCompleted && (
              <Button
                onClick={() =>
                  run("finish", () => finishCouplesQuizAction({ sessionId: session.id }))
                }
                disabled={Boolean(pending) || !canFinish}
                className="mt-6 w-full rounded-2xl bg-white text-slate-950 hover:bg-rose-50 disabled:opacity-50"
              >
                {pending === "finish" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Lihat Hasil
              </Button>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

if (process.env.NODE_ENV === "test") {
  console.assert(normalize(" Ramen Pedas ") === "ramen pedas");
}
