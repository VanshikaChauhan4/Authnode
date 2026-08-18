import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge conditional class names and resolve conflicting Tailwind utility
 * classes (e.g. "min-h-screen" vs "min-h-full"), keeping the last one wins.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
