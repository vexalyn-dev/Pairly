import { Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-slate-800">
      <div className="max-w-md w-full p-10 rounded-3xl border border-pink-100 bg-gradient-to-b from-white via-white to-pink-50 shadow-romantic text-center transition-all duration-300 hover:shadow-glow">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 text-pairly-rose text-xs font-semibold mb-6">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
          <span>Next.js 16 + shadcn/ui Active</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Pairly
        </h1>

        <p className="text-lg font-medium text-pairly-rose mb-4">
          Make moments together.
        </p>

        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          A private realtime space for two people to make, play, and keep
          moments together.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Button variant="pairly" size="lg" className="w-full sm:w-auto">
            <Heart className="w-4 h-4 fill-white" />
            <span>Create Our Space</span>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            <span>Join with Code</span>
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-rose-100 text-rose-600 text-xs font-semibold shadow-sm">
          <Sparkles className="w-4 h-4 text-rose-500" />
          <span>shadcn/ui &amp; Lucide Icons Connected</span>
        </div>
      </div>
    </main>
  );
}
