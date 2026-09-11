"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle, KeyRound, CheckCircle2, ArrowLeft } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@pairly/validation";
import { forgotPasswordAction } from "@/lib/auth/actions";
import { Button } from "@pairly/ui";

export default function ForgotPasswordPage() {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordInput) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await forgotPasswordAction(values);

      if (!result.success) {
        setErrorMessage(result.error || "Gagal mengirim tautan pemulihan.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(result.message || "Tautan pemulihan kata sandi telah dikirim!");
      setIsSubmitting(false);
    } catch {
      setErrorMessage("Terjadi gangguan jaringan. Silakan coba kembali nanti.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-pink-100/80 rounded-3xl p-8 sm:p-10 shadow-romantic transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mb-3">
          <KeyRound className="w-6 h-6 text-rose-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Reset your password 💌
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Masukkan email yang terdaftar untuk menerima instruksi reset password
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-700 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            {successMessage}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Silakan periksa kotak masuk atau folder spam email kamu dan klik tautan untuk
            membuat kata sandi baru.
          </p>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/70 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Email Akun Pairly
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              placeholder="nama@email.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`w-full h-11 px-4 rounded-xl text-sm bg-slate-50/60 border text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 ${
                errors.email
                  ? "border-rose-300 bg-rose-50/30"
                  : "border-slate-200 hover:border-pink-200"
              }`}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-rose-600 mt-1.5 font-medium">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="pairly"
            size="lg"
            disabled={isSubmitting}
            className="w-full mt-2 font-semibold shadow-soft"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengirim instruksi...</span>
              </>
            ) : (
              <span>Kirim Tautan Pemulihan</span>
            )}
          </Button>

          <div className="pt-4 text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
