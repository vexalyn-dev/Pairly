import { createBrowserClientInstance } from "@pairly/database";

/**
 * Browser-side Supabase client for Next.js Client Components ('use client').
 */
export function createClient() {
  return createBrowserClientInstance();
}
