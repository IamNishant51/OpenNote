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

export function createTauriFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
    const method = init?.method || "GET";
    const rawHeaders = init?.headers || {};
    const headers: Record<string, string> = {};
    if (rawHeaders instanceof Headers) {
      rawHeaders.forEach((v, k) => { headers[k] = v; });
    } else if (Array.isArray(rawHeaders)) {
      for (const [k, v] of rawHeaders) headers[k] = v;
    } else {
      for (const [k, v] of Object.entries(rawHeaders)) headers[k] = String(v);
    }
    let body: string | undefined;
    if (init?.body) {
      if (typeof init.body === "string") body = init.body;
      else if (init.body instanceof Blob) body = await init.body.text();
      else if (init.body instanceof URLSearchParams) body = init.body.toString();
      else body = String(init.body);
    }
    const result = await invoke<{ status: number; headers: Record<string, string>; body: string }>(
      "proxy_ai_request", { url, method, headers, body }
    );
    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    });
  };
}
