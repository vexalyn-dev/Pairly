import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isConfigured =
    Boolean(supabaseUrl) &&
    !supabaseUrl?.includes("your-project") &&
    !supabaseUrl?.includes("placeholder");

  let status: "connected" | "awaiting_credentials" | "error" = "awaiting_credentials";
  let message = "Awaiting real Supabase URL & keys in .env.local";

  if (isConfigured) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.getSession();
      if (!error) {
        status = "connected";
        message = "Successfully connected to Supabase!";
      } else {
        status = "error";
        message = `Supabase returned: ${error.message}`;
      }
    } catch (err: unknown) {
      status = "error";
      message = err instanceof Error ? err.message : "Connection failed";
    }
  }

  return NextResponse.json({
    product: "Pairly",
    tagline: "Make moments together.",
    timestamp: new Date().toISOString(),
    status,
    message,
    isConfigured,
  });
}
