export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundColor: "#ffffff",
        color: "#1f2937",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          padding: "40px 32px",
          borderRadius: "24px",
          border: "1px solid #fce7f3",
          background: "linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)",
          boxShadow: "0 10px 25px -5px rgba(244, 63, 94, 0.08)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "9999px",
            backgroundColor: "#ffe4e6",
            color: "#e11d48",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "20px",
          }}
        >
          <span>💗</span>
          <span>Next.js 16 Active</span>
        </div>

        <h1
          style={{
            fontSize: "36px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#0f172a",
            marginBottom: "8px",
          }}
        >
          Pairly
        </h1>

        <p
          style={{
            fontSize: "18px",
            fontWeight: 500,
            color: "#e11d48",
            marginBottom: "16px",
          }}
        >
          Make moments together.
        </p>

        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#64748b",
            marginBottom: "28px",
          }}
        >
          A private realtime space for two people to make, play, and keep
          moments together.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
            padding: "12px 16px",
            borderRadius: "12px",
            backgroundColor: "#ffffff",
            border: "1px solid #fed7aa",
            color: "#c2410c",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          <span>✨</span>
          <span>Phase 1: Monorepo &amp; Web App Connected</span>
        </div>
      </div>
    </main>
  );
}
