"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type SignUpInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@pairly/validation";

export type AuthActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  requiresEmailConfirmation?: boolean;
};

/**
 * Handle user registration with automatic profile creation via Postgres trigger.
 */
export async function signUpAction(input: SignUpInput): Promise<AuthActionResult> {
  const validation = signUpSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Data pendaftaran tidak valid",
    };
  }

  const { email, password, display_name, username } = validation.data;
  const normalizedUsername = username.toLowerCase().trim();

  const supabase = await createClient();

  // Check if username is already taken in profiles table
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (existingProfile) {
    return {
      success: false,
      error: "Username sudah digunakan. Silakan gunakan username lain.",
    };
  }

  // Get request origin for email redirect
  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name,
        username: normalizedUsername,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    let friendlyMessage = "Gagal mendaftar. Silakan coba lagi.";
    if (error.message.toLowerCase().includes("already registered")) {
      friendlyMessage = "Email ini sudah terdaftar. Silakan masuk langsung.";
    } else if (error.message.toLowerCase().includes("password")) {
      friendlyMessage = "Password tidak memenuhi kriteria keamanan.";
    }
    return {
      success: false,
      error: friendlyMessage,
    };
  }

  // If Supabase has email confirmation disabled, a session is created immediately
  const requiresEmailConfirmation = !data.session;

  return {
    success: true,
    requiresEmailConfirmation,
    message: requiresEmailConfirmation
      ? "Pendaftaran berhasil! Cek email kamu untuk konfirmasi akun."
      : "Pendaftaran berhasil! Mengalihkan ke dashboard...",
  };
}

/**
 * Handle user sign in with email and password.
 */
export async function signInAction(input: LoginInput): Promise<AuthActionResult> {
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Email atau password tidak valid",
    };
  }

  const { email, password } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    let friendlyMessage = "Email atau password salah. Silakan periksa kembali.";
    if (error.message.toLowerCase().includes("email not confirmed")) {
      friendlyMessage = "Email kamu belum dikonfirmasi. Periksa kotak masuk email kamu.";
    }
    return {
      success: false,
      error: friendlyMessage,
    };
  }

  return {
    success: true,
    message: "Berhasil masuk! Mengalihkan...",
  };
}

/**
 * Handle user sign out.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Request password reset instructions via email.
 */
export async function forgotPasswordAction(
  input: ForgotPasswordInput
): Promise<AuthActionResult> {
  const validation = forgotPasswordSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Email tidak valid",
    };
  }

  const { email } = validation.data;
  const supabase = await createClient();

  const headersList = await headers();
  const origin =
    headersList.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      success: false,
      error: "Gagal mengirim instruksi reset password. Pastikan email terdaftar.",
    };
  }

  return {
    success: true,
    message: "Tautan reset password telah dikirim ke email kamu jika terdaftar.",
  };
}

/**
 * Update password after completing reset flow.
 */
export async function updatePasswordAction(
  input: ResetPasswordInput
): Promise<AuthActionResult> {
  const validation = resetPasswordSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Password tidak valid",
    };
  }

  const { password } = validation.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return {
      success: false,
      error: "Gagal memperbarui password. Silakan coba lagi.",
    };
  }

  return {
    success: true,
    message: "Password berhasil diperbarui! Silakan masuk dengan password baru kamu.",
  };
}
