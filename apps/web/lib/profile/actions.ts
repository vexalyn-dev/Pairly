"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileUpdateSchema, type ProfileUpdateInput } from "@pairly/validation";
import type { ProfileRow } from "@pairly/database";

export type ProfileActionResult = {
  success: boolean;
  error?: string;
  message?: string;
  profile?: ProfileRow;
};

/**
 * Fetch the authenticated user's profile.
 */
export async function getProfileAction(): Promise<{
  success: boolean;
  profile?: ProfileRow;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Kamu belum masuk ke akun." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      success: false,
      error: "Gagal memuat profil pengguna.",
    };
  }

  return { success: true, profile: data as ProfileRow };
}

/**
 * Update the authenticated user's profile with validation & username uniqueness check.
 */
export async function updateProfileAction(
  input: ProfileUpdateInput
): Promise<ProfileActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Kamu harus masuk terlebih dahulu." };
  }

  const validation = profileUpdateSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Data profil tidak valid.",
    };
  }

  const { display_name, username, bio, avatar_url } = validation.data;
  const normalizedUsername = username.toLowerCase().trim();

  // Check username uniqueness if username is being changed
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", normalizedUsername)
    .neq("id", user.id)
    .maybeSingle();

  if (existingUser) {
    return {
      success: false,
      error: "Username ini sudah digunakan. Silakan pilih username lain.",
    };
  }

  // Update profile in database (Never allow user to change id or created_at)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from("profiles") as any)
    .update({
      display_name,
      username: normalizedUsername,
      bio: bio || null,
      avatar_url: avatar_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error || !data) {
    return {
      success: false,
      error: "Gagal menyimpan pembaruan profil.",
    };
  }

  // Also sync display_name and username to auth metadata for convenience
  await supabase.auth.updateUser({
    data: {
      display_name,
      username: normalizedUsername,
      avatar_url: avatar_url || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return {
    success: true,
    message: "Profil berhasil diperbarui!",
    profile: data as ProfileRow,
  };
}

/**
 * Upload avatar image to Supabase Storage and update profile.
 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Kamu belum masuk." };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, error: "Tidak ada file foto yang dipilih." };
  }

  // Validate file size: max 5 MB
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return { success: false, error: "Ukuran foto maksimal 5 MB." };
  }

  // Validate MIME type
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      success: false,
      error: "Format foto harus JPG, PNG, WEBP, atau GIF.",
    };
  }

  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}/${Date.now()}.${fileExt}`;

  // Upload to avatars bucket (configured in migration 0013_storage.sql)
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return {
      success: false,
      error: "Gagal mengunggah foto avatar ke penyimpanan.",
    };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  // Update profile avatar_url
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from("profiles") as any)
    .update({
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return {
    success: true,
    avatarUrl: publicUrl,
  };
}
