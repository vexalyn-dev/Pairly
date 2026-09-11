"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Users, Loader2, AlertCircle, ArrowLeft, Heart } from "lucide-react";
import { joinRoomSchema, type JoinRoomInput } from "@pairly/validation";
import { joinRoomAction } from "@/lib/room/actions";
import { Button } from "@pairly/ui";

export default function JoinRoomPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JoinRoomInput>({
    resolver: zodResolver(joinRoomSchema),
    defaultValues: {
      code: "",
    },
  });

  const codeValue = watch("code") || "";

  const onSubmit = async (values: JoinRoomInput) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await joinRoomAction(values);

      if (!result.success || !result.code) {
        setErrorMessage(result.error || "Gagal bergabung ke room.");
        setIsSubmitting(false);
        return;
      }

      // Redirect to the private room
      router.push(`/room/${result.code}`);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan saat mencoba bergabung.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-white to-pink-50/40 text-slate-900 flex flex-col justify-between py-10 px-4">
      {/* Top Brand Link */}
      <div className="max-w-md w-full mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      {/* Main Join Card */}
      <main className="max-w-md w-full mx-auto my-auto">
        <div className="bg-white/95 backdrop-blur-md border border-pink-100/90 rounded-3xl p-8 sm:p-10 shadow-romantic text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-rose-500/10 to-pink-500/10 text-rose-500 mb-4 shadow-soft">
            <Users className="w-7 h-7 text-rose-500" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Gabung ke Room Pasangan 👫
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Masukkan kode 6 karakter yang dibagikan oleh pasanganmu
          </p>

          {errorMessage && (
            <div
              role="alert"
              className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 text-left"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6" noValidate>
            {/* 6-character Code Input */}
            <div>
              <label
                htmlFor="code"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3"
              >
                Kode Unik 6 Karakter
              </label>

              <input
                id="code"
                type="text"
                autoComplete="off"
                disabled={isSubmitting}
                maxLength={6}
                value={codeValue}
                placeholder="CONTOH"
                aria-invalid={!!errors.code}
                aria-describedby={errors.code ? "code-error" : undefined}
                className="w-full h-14 text-center tracking-[0.4em] font-mono text-2xl uppercase rounded-2xl bg-slate-50 border-2 border-pink-100 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all font-bold"
                onChange={(e) => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  setValue("code", val, { shouldValidate: true });
                }}
              />

              {errors.code && (
                <p id="code-error" className="text-xs text-rose-600 mt-2 font-medium">
                  {errors.code.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="pairly"
              size="lg"
              disabled={isSubmitting || codeValue.length !== 6}
              className="w-full font-semibold shadow-soft h-12 text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Menghubungkan ke Room...</span>
                </>
              ) : (
                <span>Gabung ke Room</span>
              )}
            </Button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-4 flex items-center justify-center gap-1">
        <span>Crafted for couples with</span>
        <Heart className="w-3 h-3 fill-rose-400 text-rose-400 inline" />
        <span>by Pairly</span>
      </footer>
    </div>
  );
}
