"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, AlertCircle, Sparkles, X } from "lucide-react";
import { createRoomSchema, type CreateRoomInput } from "@pairly/validation";
import { createRoomAction } from "@/lib/room/actions";
import { Button } from "@pairly/ui";

interface CreateRoomModalProps {
  buttonText?: string;
  variant?: "pairly" | "default" | "outline";
  className?: string;
}

export function CreateRoomModal({
  buttonText = "+ Buat Room Baru",
  variant = "pairly",
  className,
}: CreateRoomModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleClose = () => {
    reset();
    setErrorMessage(null);
    setIsOpen(false);
  };

  const onSubmit = async (values: CreateRoomInput) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const result = await createRoomAction(values);

      if (!result.success || !result.code) {
        setErrorMessage(result.error || "Gagal membuat room.");
        setIsSubmitting(false);
        return;
      }

      handleClose();
      router.push(`/room/${result.code}`);
      router.refresh();
    } catch {
      setErrorMessage("Terjadi kendala jaringan saat membuat room.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button variant={variant} onClick={() => setIsOpen(true)} className={className}>
        <Plus className="w-4 h-4" />
        <span>{buttonText}</span>
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-white border border-pink-100/90 rounded-3xl p-6 sm:p-8 shadow-romantic animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Buat Room Pairly Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Ruang privat eksklusif untuk kamu dan pasangan
                </p>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Room Name */}
              <div>
                <label
                  htmlFor="room_name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1"
                >
                  Nama Room
                </label>
                <input
                  id="room_name"
                  type="text"
                  disabled={isSubmitting}
                  placeholder="Contoh: Alex & Jamie's Cozy Space"
                  className={`w-full h-11 px-4 rounded-xl text-sm bg-slate-50 border text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 ${
                    errors.name ? "border-rose-300 bg-rose-50/30" : "border-slate-200"
                  }`}
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Room Description */}
              <div>
                <label
                  htmlFor="room_desc"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1"
                >
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  id="room_desc"
                  rows={2}
                  disabled={isSubmitting}
                  placeholder="Catatan manis tentang ruang privat ini..."
                  className="w-full p-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400/50 focus:border-rose-400 resize-none"
                  {...register("description")}
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100 text-xs text-slate-600 leading-relaxed">
                💡 Setelah room dibuat, kamu akan mendapatkan **kode 6 karakter unik**
                untuk dibagikan kepada pasanganmu.
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSubmitting}
                  onClick={handleClose}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="pairly"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membuat Room...</span>
                    </>
                  ) : (
                    <span>Buat Room Sekarang</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
