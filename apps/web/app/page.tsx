import { Heart, Sparkles, Layers, Database as DatabaseIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@pairly/ui";
import { formatDate, generateRoomCode } from "@pairly/utils";
import { roomCodeSchema } from "@pairly/validation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const sampleCode = generateRoomCode();
  const isValidCode = roomCodeSchema.safeParse(sampleCode).success;
  const todayFormatted = formatDate(new Date(), "dd MMMM yyyy");

  // Check Supabase connection state safely
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isSupabaseConfigured =
    Boolean(supabaseUrl) &&
    !supabaseUrl?.includes("placeholder") &&
    !supabaseUrl?.includes("your-project");

  let supabaseStatus = "Awaiting .env.local credentials";
  let isConnected = false;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.getSession();
      if (!error) {
        supabaseStatus = "Connected to Supabase";
        isConnected = true;
      } else {
        supabaseStatus = `Supabase error: ${error.message}`;
      }
    } catch (err: unknown) {
      supabaseStatus = err instanceof Error ? err.message : "Connection failed";
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-slate-800">
      <div className="max-w-md w-full p-10 rounded-3xl border border-pink-100 bg-gradient-to-b from-white via-white to-pink-50 shadow-romantic text-center transition-all duration-300 hover:shadow-glow">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 text-pairly-rose text-xs font-semibold mb-6">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
          <span>Next.js 16 + Monorepo Active</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
          Pairly
        </h1>

        <p className="text-lg font-medium text-pairly-rose mb-4">
          Make moments together.
        </p>

        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          A private realtime space for two people to make, play, and keep
          moments together.
        </p>

        {/* Demo Shared Package Integration */}
        <div className="p-4 rounded-2xl bg-pink-50/60 border border-pink-100 mb-6 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-semibold text-slate-700">Generated Code:</span>
            <code className="px-2 py-0.5 rounded bg-white font-mono font-bold text-rose-600 border border-pink-200">
              {sampleCode}
            </code>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Validation:</span>
            <span className="text-emerald-600 font-semibold">
              {isValidCode ? "✓ Valid Room Code" : "Invalid"}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Date:</span>
            <span className="text-slate-700">{todayFormatted}</span>
          </div>
        </div>

        {/* Supabase Connection Widget */}
        <div className="p-3.5 rounded-2xl bg-white border border-pink-100 shadow-sm mb-8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="w-4 h-4 text-pairly-rose" />
            <span className="font-semibold text-slate-700">Supabase Status:</span>
          </div>
          <span
            className={`font-medium px-2 py-0.5 rounded-full ${
              isConnected
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {supabaseStatus}
          </span>
        </div>

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
          <Layers className="w-4 h-4 text-rose-500" />
          <span>Shared: @pairly/ui, @pairly/utils, @pairly/database, @pairly/validation</span>
        </div>
      </div>
    </main>
  );
}
