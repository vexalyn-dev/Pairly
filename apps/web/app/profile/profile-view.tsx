"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Heart,
  Pencil,
  X,
} from "lucide-react";
import type { ProfileRow } from "@pairly/database";
import { profileUpdateSchema, type ProfileUpdateInput } from "@pairly/validation";
import { updateProfileAction, uploadAvatarAction } from "@/lib/profile/actions";
import { Button } from "@pairly/ui";

interface ProfileViewProps {
  initialProfile: ProfileRow;
}

export function ProfileView({ initialProfile }: ProfileViewProps) {
  const router = useRouter();
  const [profile, setProfile] = React.useState<ProfileRow>(initialProfile);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      display_name: initialProfile.display_name ?? "",
      username: initialProfile.username ?? "",
      bio: initialProfile.bio || "",
      avatar_url: initialProfile.avatar_url || null,
    },
  });

  // Handle avatar file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAvatarAction(formData);

      if (!result.success || !result.avatarUrl) {
        setErrorMessage(result.error || "Gagal mengunggah avatar.");
        setIsUploading(false);
        return;
      }

      setProfile((prev) => ({ ...prev, avatar_url: result.avatarUrl || null }));
      setValue("avatar_url", result.avatarUrl);
      setSuccessMessage("Foto profil berhasil diperbarui!");
      setIsUploading(false);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala saat mengunggah foto.");
      setIsUploading(false);
    }
  };

  // Handle profile details update
  const onSubmit = async (values: ProfileUpdateInput) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const result = await updateProfileAction(values);

      if (!result.success || !result.profile) {
        setErrorMessage(result.error || "Gagal memperbarui profil.");
        setIsSubmitting(false);
        return;
      }

      setProfile(result.profile);
      setSuccessMessage("Profil kamu berhasil disimpan!");
      setIsEditing(false);
      setIsSubmitting(false);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kesalahan jaringan.");
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    reset({
      display_name: profile.display_name ?? "",
      username: profile.username ?? "",
      bio: profile.bio || "",
      avatar_url: profile.avatar_url || null,
    });
    setIsEditing(false);
    setErrorMessage(null);
  };

  // Format creation date
  const joinedDate = new Date(profile.created_at).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white/90 backdrop-blur-md border border-pink-100/90 rounded-3xl p-8 sm:p-10 shadow-romantic relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 bg-rose-200/30 rounded-full blur-2xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-pink-200 bg-gradient-to-tr from-rose-100 to-pink-100 flex items-center justify-center shadow-soft text-slate-400">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || "Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-rose-300" />
              )}
            </div>

            {/* Upload trigger button */}
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Ubah foto avatar"
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-white border border-pink-200 shadow-soft text-slate-700 hover:text-rose-600 hover:border-pink-300 flex items-center justify-center transition-all group-hover:scale-105 disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Profile Details (View Mode) */}
          {!isEditing ? (
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {profile.display_name}
                  </h1>
                  <p className="text-sm font-medium text-rose-500">@{profile.username}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-1.5 self-center sm:self-auto rounded-xl"
                >
                  <Pencil className="w-3.5 h-3.5 text-rose-500" />
                  <span>Edit Profil</span>
                </Button>
              </div>

              {/* Bio */}
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                {profile.bio || (
                  <span className="italic text-slate-400">
                    Belum ada bio. Tuliskan pesan manis untuk pasanganmu!
                  </span>
                )}
              </p>

              {/* Meta Info */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Bergabung sejak {joinedDate}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-rose-500">
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                  <span>Pairly Space Member</span>
                </span>
              </div>
            </div>
          ) : (
            /* Profile Details (Edit Mode) */
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Edit Profil</h2>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* Display Name */}
                <div>
                  <label
                    htmlFor="display_name"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    Nama Panggilan
                  </label>
                  <input
                    id="display_name"
                    type="text"
                    disabled={isSubmitting}
                    className={`w-full h-10 px-3.5 rounded-xl text-sm bg-slate-50/70 border text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 ${
                      errors.display_name
                        ? "border-rose-300 bg-rose-50/30"
                        : "border-slate-200"
                    }`}
                    {...register("display_name")}
                  />
                  {errors.display_name && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {errors.display_name.message}
                    </p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label
                    htmlFor="username"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      @
                    </span>
                    <input
                      id="username"
                      type="text"
                      disabled={isSubmitting}
                      className={`w-full h-10 pl-7 pr-3.5 rounded-xl text-sm bg-slate-50/70 border text-slate-900 lowercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 ${
                        errors.username
                          ? "border-rose-300 bg-rose-50/30"
                          : "border-slate-200"
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
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {errors.username.message}
                    </p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1"
                  >
                    Bio (Catatan Manis)
                  </label>
                  <textarea
                    id="bio"
                    rows={3}
                    disabled={isSubmitting}
                    placeholder="Tuliskan pesan cinta singkat atau kutipan favorit..."
                    className="w-full p-3 rounded-xl text-sm bg-slate-50/70 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 resize-none"
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      {errors.bio.message}
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleCancelEdit}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="pairly"
                    size="sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
