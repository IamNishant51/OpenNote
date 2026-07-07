import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isPlainIconLabel(value?: string | null) {
  if (!value) return false;
  const trimmed = value.trim();
  return /^[A-Za-z0-9][A-Za-z0-9 _-]{0,20}$/.test(trimmed);
}
