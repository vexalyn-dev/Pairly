export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-slate-800">
      <div className="max-w-md w-full p-10 rounded-3xl border border-pink-100 bg-gradient-to-b from-white via-white to-pink-50 shadow-romantic text-center transition-all duration-300 hover:shadow-glow">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100 text-pairly-rose text-xs font-semibold mb-6">
          <span className="text-sm">💗</span>
          <span>Tailwind CSS &amp; Next.js 16 Active</span>
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

        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-rose-100 text-rose-600 text-xs font-semibold shadow-sm">
          <span>✨</span>
          <span>Design Tokens: Soft Pink &amp; Rose Ready</span>
        </div>
      </div>
    </main>
  );
}
