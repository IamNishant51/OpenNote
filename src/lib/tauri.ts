import { invoke } from "@tauri-apps/api/core";

export function isTauriRuntime() {
  return typeof window !== "undefined" && Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
}

export async function safeInvoke<T>(command: string, args?: Record<string, unknown>, fallback?: T | null): Promise<T | null> {
  try {
    return await invoke<T>(command, args);
  } catch {
    return fallback ?? null;
  }
}
