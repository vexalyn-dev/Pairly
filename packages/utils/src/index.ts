import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

/**
 * Combines class names with Tailwind Merge resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a clean, readable 6-character uppercase room code.
 * Excludes easily confusable characters (0, O, 1, I).
 */
export function generateRoomCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Formats a timestamp into human-readable relative time (e.g., "5 minutes ago")
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "just now";
  }
}

/**
 * Formats a date string into custom display format
 */
export function formatDate(date: string | Date, pattern = "PPP"): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, pattern);
  } catch {
    return "";
  }
}
