"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Copy,
  Check,
  User,
  Users,
  ArrowLeft,
  Sparkles,
  Gamepad2,
  Camera,
  Paintbrush,
  BookHeart,
  Flame,
  Activity,
  Share2,
  LogOut,
  Radio,
  Loader2,
  X,
  AlertCircle,
  Send,
} from "lucide-react";
import type { RoomRow, ProfileRow } from "@pairly/database";
import { Button } from "@pairly/ui";
import { createClient } from "@/lib/supabase/client";
import { getRoomDetailsAction, leaveRoomAction } from "@/lib/room/actions";

interface RoomClientViewProps {
  room: RoomRow;
  members: {
    id: string;
    user_id: string;
    role: string;
    profile: ProfileRow;
  }[];
  partner: ProfileRow | null;
  currentUserId: string;
  isOwner: boolean;
}

interface FloatingReaction {
  id: string;
  emoji: string;
  sender: string;
  leftPercent: number;
}

const ACTIVITY_PLACEHOLDERS = [
  {
    id: "couples-quiz",
    name: "Couples Quiz",
    category: "Quiz & Trivia",
    description: "Kuis seru untuk menguji seberapa dalam kamu mengenal satu sama lain.",
    icon: Gamepad2,
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "photobooth",
    name: "Retro Photobooth",
    category: "Memories & Media",
    description: "Ambil strip foto bergaya retro berdua dengan frame romantis.",
    icon: Camera,
    color: "from-amber-500 to-rose-500",
  },
  {
    id: "shared-canvas",
    name: "Shared Canvas",
    category: "Creative & Art",
    description: "Menggambar dan corat-coret bersama di kanvas realtime.",
    icon: Paintbrush,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "memories-timeline",
    name: "Romantic Memories",
    category: "Memories & Media",
    description: "Abadikan timeline perjalanan cinta, tanggal jadian, dan jurnal berdua.",
    icon: BookHeart,
    color: "from-pink-500 to-rose-400",
  },
  {
    id: "truth-or-dare",
    name: "Truth or Dare",
    category: "Social & Fun",
    description: "Pertanyaan intim dan tantangan manis untuk mendekatkan hati.",
    icon: Flame,
    color: "from-red-500 to-pink-500",
  },
  {
    id: "heartbeat-sync",
    name: "Heartbeat Sync",
    category: "Sensory & Romance",
    description: "Sinkronisasi detak jantung dan sentuhan virtual jarak jauh.",
    icon: Activity,
    color: "from-rose-400 to-pink-600",
  },
];

const REACTION_SHORTCUTS = [
  { emoji: "💓", label: "Detak Jantung" },
  { emoji: "🤗", label: "Pelukan Hangat" },
  { emoji: "💋", label: "Ciuman Manis" },
  { emoji: "✨", label: "Taburan Cinta" },
];

export function RoomClientView({
  room,
  members: initialMembers,
  partner: initialPartner,
  currentUserId,
  isOwner,
}: RoomClientViewProps) {
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  // Dynamic Room & Partner state
  const [members, setMembers] = React.useState(initialMembers);
  const [partner, setPartner] = React.useState<ProfileRow | null>(initialPartner);

  // Realtime Presence state
  const [isPartnerOnline, setIsPartnerOnline] = React.useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = React.useState<string | null>(null);

  // Realtime Reactions
  const [floatingReactions, setFloatingReactions] = React.useState<FloatingReaction[]>(
    []
  );
  const [recentReactionNotice, setRecentReactionNotice] = React.useState<{
    sender: string;
    emoji: string;
  } | null>(null);

  // Leave room modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);
  const [leaveError, setLeaveError] = React.useState<string | null>(null);

  // Realtime Supabase Channel Reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = React.useRef<any>(null);

  const currentUserMember = members.find((m) => m.user_id === currentUserId);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to spawn floating reaction
  const triggerReactionDisplay = React.useCallback((emoji: string, sender: string) => {
    const newReaction: FloatingReaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji,
      sender,
      leftPercent: 20 + Math.random() * 60, // Random horizontal position 20% - 80%
    };

    setFloatingReactions((prev) => [...prev.slice(-15), newReaction]);
    setRecentReactionNotice({ sender, emoji });

    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3500);

    setTimeout(() => {
      setRecentReactionNotice((curr) => (curr?.sender === sender ? null : curr));
    }, 4000);
  }, []);

  // Send reaction over Realtime Broadcast
  const handleSendReaction = (emoji: string) => {
    const senderName = currentUserMember?.profile.display_name || "Kamu";
    triggerReactionDisplay(emoji, senderName);

    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "couple_interaction",
        payload: {
          emoji,
          sender: senderName,
          senderId: currentUserId,
        },
      });
    }
  };

  // Set up Supabase Realtime (Presence, Broadcast & Room Members Change)
  React.useEffect(() => {
    const supabase = createClient();
    const channelName = `room:${room.id}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channelRef.current = channel;

    // 1. Presence Sync & Tracking
    channel
      .on("presence", { event: "sync" }, () => {
        const presenceState = channel.presenceState();
        // Check if any presence entry belongs to another user
        const otherPresences = Object.entries(presenceState).filter(
          ([key]) => key !== currentUserId
        );

        if (otherPresences.length > 0) {
          setIsPartnerOnline(true);
          setPartnerLastSeen(null);
        } else {
          setIsPartnerOnline(false);
        }
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (key !== currentUserId) {
          setIsPartnerOnline(true);
          setPartnerLastSeen(null);
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (key !== currentUserId) {
          setIsPartnerOnline(false);
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          setPartnerLastSeen(`Terakhir aktif pukul ${timeStr}`);
        }
      });

    // 2. Listen to Broadcast Couple Interactions
    channel.on(
      "broadcast",
      { event: "couple_interaction" },
      ({ payload }: { payload: { emoji: string; sender: string; senderId: string } }) => {
        if (payload.senderId !== currentUserId) {
          triggerReactionDisplay(payload.emoji, payload.sender);
        }
      }
    );

    // 3. Listen to Postgres Changes on room_members (Automated pairing sync when partner joins)
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_members",
        filter: `room_id=eq.${room.id}`,
      },
      async () => {
        // Automatically refresh room details without full page reload
        const result = await getRoomDetailsAction(room.code);
        if (result.success && result.members) {
          setMembers(result.members);
          setPartner(result.partner || null);
        }
      }
    );

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: currentUserId,
          online_at: new Date().toISOString(),
          display_name: currentUserMember?.profile.display_name || "User",
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    room.id,
    room.code,
    currentUserId,
    currentUserMember?.profile.display_name,
    triggerReactionDisplay,
  ]);

  // Handle Leave Room Action
  const handleConfirmLeave = async () => {
    try {
      setIsLeaving(true);
      setLeaveError(null);

      const res = await leaveRoomAction(room.id);
      if (!res.success) {
        setLeaveError(res.error || "Gagal keluar dari room.");
        setIsLeaving(false);
        return;
      }

      setIsLeaveModalOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setLeaveError("Terjadi kendala jaringan saat keluar dari room.");
      setIsLeaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-rose-50/50 via-white to-pink-50/30 text-slate-900 pb-20 overflow-hidden">
      {/* Floating Reactions Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        {floatingReactions.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-10 flex flex-col items-center animate-float-up opacity-90 transition-all"
            style={{ left: `${item.leftPercent}%` }}
          >
            <span className="text-4xl sm:text-5xl filter drop-shadow-md select-none">
              {item.emoji}
            </span>
            <span className="text-[10px] font-semibold text-rose-600 bg-white/90 border border-pink-200 px-2 py-0.5 rounded-full shadow-sm mt-1">
              {item.sender}
            </span>
          </div>
        ))}
      </div>

      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-pink-100/70 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-pink-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-bold text-base text-slate-900 line-clamp-1">
                {room.name}
              </h1>
              <span className="text-[11px] text-slate-400">
                {isOwner ? "Owner (Pembuat Room)" : "Partner Space"}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Copy Code Pill */}
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:border-pink-300 hover:bg-pink-50/40 transition-all font-medium"
            >
              <span className="text-slate-400 hidden sm:inline">Kode:</span>
              <span className="font-mono font-bold tracking-widest text-slate-900">
                {room.code}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Leave Room Button */}
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
              title="Keluar dari room"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Room Container */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Recent Reaction Alert Banner */}
        {recentReactionNotice && (
          <div className="mb-6 max-w-md mx-auto p-3 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border border-pink-200 shadow-soft flex items-center justify-center gap-2 text-xs font-semibold text-rose-700 animate-in fade-in slide-in-from-top-2">
            <span className="text-xl">{recentReactionNotice.emoji}</span>
            <span>{recentReactionNotice.sender} mengirim interaksi manis!</span>
          </div>
        )}

        {/* Partner Connection Status Card */}
        <section className="bg-white/90 backdrop-blur-md border border-pink-100/90 rounded-3xl p-6 sm:p-8 shadow-romantic mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Members Avatars & Connection Visual */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* User Avatar */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-100 to-pink-100 border-2 border-rose-300 overflow-hidden flex items-center justify-center shadow-soft mb-2">
                    {currentUserMember?.profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentUserMember.profile.avatar_url}
                        alt={currentUserMember.profile.display_name || "Kamu"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-rose-400" />
                    )}
                  </div>
                  {/* Live Status Indicator (Local User) */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"
                    title="Online (Kamu)"
                  />
                </div>
                <span className="text-xs font-bold text-slate-800 line-clamp-1">
                  {currentUserMember?.profile.display_name || "Kamu"}
                </span>
                <span className="text-[10px] text-slate-400">Kamu (Online)</span>
              </div>

              {/* Heart Pulse Visual */}
              <div className="flex flex-col items-center justify-center px-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    partner
                      ? isPartnerOnline
                        ? "bg-rose-500 text-white shadow-romantic animate-pulse scale-110"
                        : "bg-rose-50 text-rose-500"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 font-medium flex items-center gap-1">
                  {partner ? (
                    isPartnerOnline ? (
                      <span className="text-emerald-600 font-bold">Terhubung 💓</span>
                    ) : (
                      <span>Tersambung</span>
                    )
                  ) : (
                    "Menunggu"
                  )}
                </span>
              </div>

              {/* Partner Avatar */}
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div
                    className={`w-16 h-16 rounded-2xl border-2 overflow-hidden flex items-center justify-center shadow-soft mb-2 ${
                      partner
                        ? "bg-gradient-to-tr from-pink-100 to-rose-100 border-pink-300"
                        : "bg-slate-50 border-dashed border-slate-300"
                    }`}
                  >
                    {partner?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={partner.avatar_url}
                        alt={partner.display_name || "Pasangan"}
                        className="w-full h-full object-cover"
                      />
                    ) : partner ? (
                      <User className="w-8 h-8 text-pink-400" />
                    ) : (
                      <Users className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Partner Online / Offline Indicator Badge */}
                  {partner && (
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                        isPartnerOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                      }`}
                      title={
                        isPartnerOnline ? "Pasangan sedang Online" : "Pasangan Offline"
                      }
                    />
                  )}
                </div>

                <span className="text-xs font-bold text-slate-800 line-clamp-1">
                  {partner ? partner.display_name : "Pasangan"}
                </span>
                <span className="text-[10px] text-slate-400">
                  {partner ? (
                    isPartnerOnline ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Online
                      </span>
                    ) : (
                      partnerLastSeen || `@${partner.username}`
                    )
                  ) : (
                    "Belum bergabung"
                  )}
                </span>
              </div>
            </div>

            {/* Room Info & Share Action */}
            <div className="text-center md:text-right">
              {partner ? (
                <div className="flex flex-col items-center md:items-end gap-2">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      isPartnerOnline
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                        : "bg-slate-50 border border-slate-200 text-slate-600"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPartnerOnline ? "bg-emerald-500 animate-ping" : "bg-slate-400"
                      }`}
                    />
                    <span>
                      {isPartnerOnline
                        ? "Pasangan ada di room bersamamu!"
                        : "Ruang berdua aktif (Pasangan offline)"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Semua aktivitas berdua disinkronkan secara realtime.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center md:items-end gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Menunggu pasangan bergabung...</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-2 text-xs rounded-xl"
                  >
                    <Share2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Salin Kode Undangan ({room.code})</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Couple Micro-Interactions Toolbar */}
          {partner && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Kirim Reaksi Cepat ke Pasangan:</span>
              </div>

              <div className="flex items-center gap-2">
                {REACTION_SHORTCUTS.map((act) => (
                  <button
                    key={act.label}
                    onClick={() => handleSendReaction(act.emoji)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50/70 hover:bg-pink-100 text-xs font-medium text-slate-800 border border-pink-200/70 hover:border-pink-300 transition-all hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <span className="text-base">{act.emoji}</span>
                    <span className="hidden sm:inline text-[11px]">{act.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Activities Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Aktivitas Berdua 🎲</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih aktivitas untuk dimainkan bersama pasangan secara realtime
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACTIVITY_PLACEHOLDERS.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  className="group bg-white/90 backdrop-blur-md border border-pink-100/80 rounded-3xl p-6 shadow-soft hover:shadow-romantic transition-all flex flex-col justify-between"
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${act.color} flex items-center justify-center text-white shadow-soft mb-4 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <span className="text-[11px] font-semibold text-rose-500 tracking-wider uppercase">
                      {act.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">
                      {act.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {act.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      Phase Berikutnya
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      className="text-xs text-slate-400"
                    >
                      Segera Hadir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Leave Room Confirmation Modal */}
      {isLeaveModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md bg-white border border-pink-100 rounded-3xl p-6 sm:p-8 shadow-romantic animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
              <LogOut className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Keluar dari Room {room.name}?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Kamu akan keluar dari room privat ini. Jika ingin bergabung kembali, kamu
              dapat menggunakan kode <strong>{room.code}</strong> selama kuota ruang belum
              penuh.
            </p>

            {leaveError && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span>{leaveError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                disabled={isLeaving}
                onClick={() => setIsLeaveModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="default"
                disabled={isLeaving}
                onClick={handleConfirmLeave}
                className="bg-rose-500 hover:bg-rose-600 text-white gap-2"
              >
                {isLeaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Ya, Keluar Room</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
