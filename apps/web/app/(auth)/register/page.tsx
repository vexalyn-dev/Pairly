"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle, Sparkles, MailCheck } from "lucide-react";
import { signUpSchema, type SignUpInput } from "@pairly/validation";
import { signUpAction } from "@/lib/auth/actions";
import { Button } from "@pairly/ui";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      display_name: "",
      username: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: SignUpInput) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await signUpAction(values);

      if (!result.success) {
        setErrorMessage(result.error || "Pendaftaran gagal. Silakan coba lagi.");
        setIsSubmitting(false);
        return;
      }

      if (result.requiresEmailConfirmation) {
        setRegisteredEmail(values.email);
        setIsSubmitting(false);
        return;
      }

      // If no confirmation needed, push to dashboard
      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala saat mendaftar. Silakan coba lagi nanti.");
      setIsSubmitting(false);
    }
  };

  // State: Email Confirmation Notice
  if (registeredEmail) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-pink-100/80 rounded-3xl p-8 sm:p-10 shadow-romantic text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 mb-5 shadow-soft">
          <MailCheck className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Cek Email Kamu 💌
        </h2>
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">
          Kami telah mengirimkan tautan konfirmasi pendaftaran ke:
        </p>
        <p className="font-semibold text-slate-800 mt-1 px-4 py-2 bg-pink-50/60 rounded-xl inline-block text-sm border border-pink-100">
          {registeredEmail}
        </p>
        <p className="text-xs text-slate-500 mt-4">
          Klik tautan di email untuk mengaktifkan akunmu dan mulai membuat room berdua
          bersama pasangan.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full h-11 rounded-xl text-sm font-semibold text-rose-500 bg-rose-50/60 hover:bg-rose-100/80 transition-colors"
          >
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-md border border-pink-100/80 rounded-3xl p-8 sm:p-10 shadow-romantic transition-all">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 mb-3">
          <Sparkles className="w-6 h-6 text-rose-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Create your Pairly 🌸
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Mulai ruang intim dan abadikan momen berdua
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Display Name Field */}
        <div>
          <label
            htmlFor="display_name"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Nama Panggilan
          </label>
          <input
            id="display_name"
            type="text"
            autoComplete="name"
            disabled={isSubmitting}
            placeholder="Contoh: Alex"
            aria-invalid={!!errors.display_name}
            aria-describedby={errors.display_name ? "display_name-error" : undefined}
            className={`w-full h-11 px-4 rounded-xl text-sm bg-slate-50/60 border text-slate-900 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 ${
              errors.display_name
                ? "border-rose-300 bg-rose-50/30"
                : "border-slate-200 hover:border-pink-200"
            }`}
            {...register("display_name")}
          />
          {errors.display_name && (
            <p
              id="display_name-error"
              className="text-xs text-rose-600 mt-1.5 font-medium"
            >
              {errors.display_name.message}
            </p>
          )}
        </div>

        {/* Username Field */}
        <div>
          <label
            htmlFor="username"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Username
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
              @
            </span>
            <input
              id="username"
              type="text"
              autoComplete="username"
              disabled={isSubmitting}
              placeholder="alex_love"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
              className={`w-full h-11 pl-8 pr-4 rounded-xl text-sm bg-slate-50/60 border text-slate-900 lowercase transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 ${
                errors.username
                  ? "border-rose-300 bg-rose-50/30"
                  : "border-slate-200 hover:border-pink-200"
              }`}
              {...register("username", {
                onChange: (e) => {
                  setValue(
                    "username",
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                  );
                },
              })}
            />
          </div>
          {errors.username && (
            <p id="username-error" className="text-xs text-rose-600 mt-1.5 font-medium">
              {errors.username.message}
            </p>
          )}
        </div>

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
          <label
            htmlFor="password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Password
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

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirm_password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              id="confirm_password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={isSubmitting}
              placeholder="Ulangi password kamu"
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
          className="w-full mt-3 font-semibold shadow-soft"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mendaftarkan akun...</span>
            </>
          ) : (
            <span>Daftar Akun Pairly</span>
          )}
        </Button>
      </form>

      {/* Switch to Login */}
      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600">
          Sudah punya akun berdua?{" "}
          <Link
            href="/login"
            className="font-semibold text-rose-500 hover:text-rose-600 hover:underline transition-colors"
          >
            Masuk sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
