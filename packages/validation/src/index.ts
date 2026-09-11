import { z } from "zod";

// ==========================================
// ROOM VALIDATION SCHEMAS
// ==========================================

export const roomCodeSchema = z
  .string()
  .trim()
  .length(6, "Room code must be exactly 6 characters")
  .regex(/^[A-Z0-9]+$/, "Room code must only contain uppercase letters and numbers");

export const createRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Room name must be at least 2 characters")
    .max(50, "Room name cannot exceed 50 characters"),
});

export const joinRoomSchema = z.object({
  code: roomCodeSchema,
  nickname: z
    .string()
    .trim()
    .min(1, "Nickname is required")
    .max(30, "Nickname cannot exceed 30 characters")
    .optional(),
});

// ==========================================
// PROFILE VALIDATION SCHEMAS
// ==========================================

export const profileUpdateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username cannot exceed 20 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username must only contain lowercase letters, numbers, and underscores"
    )
    .optional(),
  display_name: z
    .string()
    .trim()
    .min(1, "Display name cannot be empty")
    .max(50, "Display name cannot exceed 50 characters"),
  bio: z.string().trim().max(160, "Bio cannot exceed 160 characters").optional(),
  avatar_url: z.string().url("Invalid avatar URL").optional().nullable(),
});

// ==========================================
// AUTH SCHEMAS
// ==========================================

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signUpSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  display_name: z.string().trim().min(2, "Display name must be at least 2 characters"),
});

// Type inferences
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
