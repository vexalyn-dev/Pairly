import { z } from "zod";

// ==========================================
// ROOM VALIDATION SCHEMAS
// ==========================================

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(6, "Kode room harus tepat 6 karakter")
  .regex(/^[A-Z0-9]+$/, "Kode room hanya boleh berisi huruf kapital dan angka");

export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama room minimal 2 karakter")
    .max(50, "Nama room maksimal 50 karakter"),
  description: z
    .string()
    .trim()
    .max(200, "Deskripsi maksimal 200 karakter")
    .optional(),
});

export const joinRoomSchema = z.object({
  code: roomCodeSchema,
});

// ==========================================
// PROFILE VALIDATION SCHEMAS
// ==========================================

export const profileUpdateSchema = z.object({
  display_name: z
    .string()
    .trim()
    .min(1, "Nama panggilan tidak boleh kosong")
    .max(50, "Nama panggilan maksimal 50 karakter"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(
      /^[a-z0-9_]+$/,
      "Username hanya boleh berisi huruf kecil, angka, dan garis bawah (_)"
    ),
  bio: z.string().trim().max(160, "Bio maksimal 160 karakter").optional(),
  avatar_url: z.string().optional().nullable(),
});

// ==========================================
// AUTH SCHEMAS
// ==========================================

export const loginSchema = z.object({
  email: z.string().trim().email("Masukkan alamat email yang valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const signUpSchema = z
  .object({
    display_name: z
      .string()
      .trim()
      .min(2, "Nama panggilan minimal 2 karakter")
      .max(50, "Nama panggilan maksimal 50 karakter"),
    username: z
      .string()
      .trim()
      .min(3, "Username minimal 3 karakter")
      .max(30, "Username maksimal 30 karakter")
      .regex(
        /^[a-z0-9_]+$/,
        "Username hanya boleh berisi huruf kecil, angka, dan garis bawah (_)"
      ),
    email: z.string().trim().email("Masukkan alamat email yang valid"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Za-z]/, "Password harus mengandung minimal satu huruf")
      .regex(/[0-9]/, "Password harus mengandung minimal satu angka"),
    confirm_password: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Masukkan alamat email yang valid"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Za-z]/, "Password harus mengandung minimal satu huruf")
      .regex(/[0-9]/, "Password harus mengandung minimal satu angka"),
    confirm_password: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

// ==========================================
// ACTIVITY VALIDATION SCHEMAS
// ==========================================

export const activitySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug aktivitas minimal 2 karakter")
  .max(80, "Slug aktivitas maksimal 80 karakter")
  .regex(/^[a-z0-9-]+$/, "Slug aktivitas hanya boleh berisi huruf kecil, angka, dan dash");

export const startActivitySessionSchema = z.object({
  roomId: z.string().uuid("Room tidak valid"),
  activitySlug: activitySlugSchema,
});

export const finishActivitySessionSchema = z.object({
  sessionId: z.string().uuid("Sesi aktivitas tidak valid"),
  status: z.enum(["completed", "abandoned", "cancelled"]),
  state: z.record(z.string(), z.unknown()).optional(),
});

export const appendActivityEventSchema = z.object({
  sessionId: z.string().uuid("Sesi aktivitas tidak valid"),
  eventType: z
    .string()
    .trim()
    .min(2, "Tipe event minimal 2 karakter")
    .max(80, "Tipe event maksimal 80 karakter"),
  payload: z.record(z.string(), z.unknown()).optional(),
});

// Type inferences
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type StartActivitySessionInput = z.infer<typeof startActivitySessionSchema>;
export type FinishActivitySessionInput = z.infer<typeof finishActivitySessionSchema>;
export type AppendActivityEventInput = z.infer<typeof appendActivityEventSchema>;
