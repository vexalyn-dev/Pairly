"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { resetPasswordSchema, type ResetPasswordInput } from "@pairly/validation";
import { updatePasswordAction } from "@/lib/auth/actions";
import { Button } from "@pairly/ui";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: ResetPasswordInput) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await updatePasswordAction(values);

      if (!result.success) {
        setErrorMessage(result.error || "Gagal memperbarui password.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setIsSubmitting(false);

      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch {
      setErrorMessage("Terjadi gangguan jaringan. Silakan coba kembali nanti.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-pink-100/80 rounded-3xl p-8 sm:p-10 shadow-romantic transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mb-3">
          <ShieldCheck className="w-6 h-6 text-rose-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Buat Password Baru 🔑
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Masukkan password baru untuk akun Pairly kamu
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

      {isSuccess ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <p className="text-sm text-slate-700 font-semibold leading-relaxed">
            Password kamu berhasil diperbarui!
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Mengalihkan kamu ke halaman masuk dalam beberapa detik...
          </p>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/login"
              className="font-semibold text-rose-500 hover:text-rose-600 text-sm"
            >
              Masuk sekarang
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* New Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Password Baru
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isSubmitting}
                placeholder="Minimal 8 karakter (huruf & angka)"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`w-full h-11 px-4 pr-11 rounded-xl text-sm bg-slate-50/60 border text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 ${
                  errors.password
                    ? "border-rose-300 bg-rose-50/30"
                    : "border-slate-200 hover:border-pink-200"
                }`}
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-rose-600 mt-1.5 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm New Password Field */}
          <div>
            <label
              htmlFor="confirm_password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Konfirmasi Password Baru
            </label>
            <div className="relative">
              <input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                disabled={isSubmitting}
                placeholder="Ulangi password baru"
                aria-invalid={!!errors.confirm_password}
                aria-describedby={
                  errors.confirm_password ? "confirm_password-error" : undefined
                }
                className={`w-full h-11 px-4 pr-11 rounded-xl text-sm bg-slate-50/60 border text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 ${
                  errors.confirm_password
                    ? "border-rose-300 bg-rose-50/30"
                    : "border-slate-200 hover:border-pink-200"
                }`}
                {...register("confirm_password")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p
                id="confirm_password-error"
                className="text-xs text-rose-600 mt-1.5 font-medium"
              >
                {errors.confirm_password.message}
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
                <span>Menyimpan password baru...</span>
              </>
            ) : (
              <span>Simpan Password Baru</span>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
