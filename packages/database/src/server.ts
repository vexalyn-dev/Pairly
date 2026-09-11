import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./types";

export interface CookieMethods {
  getAll: () =>
    { name: string; value: string }[] | Promise<{ name: string; value: string }[]>;
  setAll?: (
    cookies: { name: string; value: string; options: CookieOptions }[]
  ) => void | Promise<void>;
}

/**
 * Creates a typed Supabase server client for Next.js Server Components, Server Actions,
 * and Route Handlers using standard @supabase/ssr cookie adapters.
 */
export function createServerClientInstance(
  cookieMethods: CookieMethods,
  supabaseUrl?: string,
  supabaseKey?: string
) {
  const url =
    supabaseUrl ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://placeholder-project.supabase.co";
  const key =
    supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieMethods.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        if (cookieMethods.setAll) {
          cookieMethods.setAll(cookiesToSet);
        }
      },
    },
  });
}
