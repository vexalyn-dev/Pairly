import { cookies } from "next/headers";
import { createServerClientInstance } from "@pairly/database";

/**
 * Server-side Supabase client for Server Components, Server Actions, and Route Handlers.
 * Fully compatible with Next.js 16 async cookie store.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClientInstance({
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // The `setAll` method was called from a Server Component.
        // This can be safely ignored when middleware handles session refresh.
      }
    },
  });
}
