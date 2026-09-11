"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle, Heart } from "lucide-react";
import { loginSchema, type LoginInput } from "@pairly/validation";
import { signInAction } from "@/lib/auth/actions";
import { Button } from "@pairly/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const callbackError = searchParams.get("error");

  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(
    callbackError === "auth_callback_failed"
      ? "Sesi autentikasi kedaluwarsa atau tidak valid. Silakan masuk kembali."
      : null
  );
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await signInAction(values);

      if (!result.success) {
        setErrorMessage(result.error || "Gagal masuk. Silakan coba lagi.");
        setIsSubmitting(false);
        return;
      }

      // Success, route to destination
      router.push(redirectTo);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan. Silakan coba beberapa saat lagi.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-pink-100/80 rounded-3xl p-8 sm:p-10 shadow-romantic transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mb-3">
          <Heart className="w-6 h-6 fill-rose-500/20" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Welcome back 💗
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Masuk ke ruang privatmu bersama pasangan
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Email Field */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Email
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

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-rose-500 hover:text-rose-600 font-medium hover:underline transition-colors"
            >
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isSubmitting}
              placeholder="••••••••"
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
              <span>Sedang masuk...</span>
            </>
          ) : (
            <span>Masuk ke Pairly</span>
          )}
        </Button>
      </form>

      {/* Switch to Register */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600">
          Belum punya akun berdua?{" "}
          <Link
            href="/register"
            className="font-semibold text-rose-500 hover:text-rose-600 hover:underline transition-colors"
          >
            Buat akun Pairly
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="bg-white/90 backdrop-blur-md border border-pink-100/80 rounded-3xl p-12 shadow-romantic text-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Memuat halaman masuk...</p>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
