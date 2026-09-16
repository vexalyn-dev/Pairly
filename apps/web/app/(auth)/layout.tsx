import Link from "next/link";
import { Heart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-gradient-to-b from-rose-50/60 via-white to-pink-50/40 text-slate-900 selection:bg-rose-100 selection:text-rose-600">
      {/* Subtle ambient decorative blur circles */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-10 w-80 h-80 bg-pink-200/25 rounded-full blur-3xl"
        aria-hidden="true"
      />

      {/* Header with Pairly branding */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 group transition-transform hover:scale-105"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-soft group-hover:shadow-romantic transition-shadow">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Pairly
            </span>
            <span className="text-[11px] font-medium text-rose-500 -mt-1 tracking-wide">
              Make moments together.
            </span>
          </div>
        </Link>
      </header>

      {/* Main card container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Pairly. Di buat degan 💗 Oleh 2 Cowok Ganteng.</p>
      </footer>
    </div>
  );
}
