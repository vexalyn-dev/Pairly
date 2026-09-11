import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  LogOut,
  Plus,
  User,
  Users,
  Copy,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/lib/auth/actions";
import { getUserRoomsAction } from "@/lib/room/actions";
import { CreateRoomModal } from "@/components/create-room-modal";
import { Button } from "@pairly/ui";
import type { ProfileRow } from "@pairly/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch user profile
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as ProfileRow | null;
  const displayName =
    profile?.display_name || (user.user_metadata?.display_name as string) || "Partner";
  const username =
    profile?.username || (user.user_metadata?.username as string) || "user";

  // 2. Fetch user's active rooms
  const roomsResult = await getUserRoomsAction();
  const rooms = roomsResult.rooms || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-pink-50/30 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-pink-100/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Pairly</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Profile Link */}
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-50/70 border border-pink-100 text-xs text-slate-700 hover:bg-pink-100/60 hover:text-rose-600 transition-colors"
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-rose-500" />
              )}
              <span className="font-semibold hidden sm:inline">{displayName}</span>
              <span className="text-slate-400 hidden sm:inline">(@{username})</span>
            </Link>

            {/* Logout Button */}
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Keluar dari akun"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-xs text-rose-600 font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Ruang Privat Berdua</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Hi, {displayName} 💗
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Kelola room pribadimu atau gabung ke room yang dibuat pasangan
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/join">
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4 text-rose-500" />
                <span>Gabung Room</span>
              </Button>
            </Link>
            <CreateRoomModal buttonText="+ Buat Room" />
          </div>
        </div>

        {/* Existing Rooms Section */}
        {rooms.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Room Pasangan Kamu ({rooms.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white/90 backdrop-blur-md border border-pink-100/90 rounded-3xl p-6 shadow-soft hover:shadow-romantic transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                        {room.role === "owner" ? "Owner (Pembuat)" : "Partner (Anggota)"}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                          room.member_count === 2
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            room.member_count === 2 ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {room.member_count === 2
                          ? "2 Terhubung 👫"
                          : "Menunggu Pasangan ⏳"}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-1">{room.name}</h3>

                    {/* Room Code Badge */}
                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="text-xs text-slate-500 font-medium">
                        Kode Room:
                      </span>
                      <span className="font-mono font-bold tracking-widest text-slate-800 text-sm">
                        {room.code}
                      </span>
                    </div>

                    {/* Partner Info */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                      {room.partner ? (
                        <>
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-100 to-pink-100 border border-pink-200 overflow-hidden flex items-center justify-center shrink-0">
                            {room.partner.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={room.partner.avatar_url}
                                alt={room.partner.display_name || "Partner"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-rose-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-slate-400">Pasangan Terhubung:</p>
                            <p className="text-sm font-semibold text-slate-800">
                              {room.partner.display_name}{" "}
                              <span className="text-slate-400 font-normal">
                                (@{room.partner.username})
                              </span>
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-500" />
                          <span>
                            Belum ada pasangan. Bagikan kode <strong>{room.code}</strong>.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Open Room Action */}
                  <div className="mt-6 pt-4">
                    <Link href={`/room/${room.code}`}>
                      <Button variant="pairly" className="w-full justify-between group">
                        <span>Buka Room Pasangan</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white/80 backdrop-blur-md border border-pink-100/80 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto shadow-romantic">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-5 shadow-soft">
              <Heart className="w-8 h-8 fill-rose-500/20" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Belum Ada Room Pasangan</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Mulai ruang intimmu berdua! Buat room baru dan bagikan kodenya, atau
              masukkan kode yang sudah dibuat oleh pasanganmu.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <CreateRoomModal
                buttonText="+ Buat Room Baru"
                className="w-full sm:w-auto"
              />
              <Link href="/join" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 text-rose-500" />
                  <span>Gabung Room Pasangan</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
