import type { TInitPayload, TResponseJSON } from "@dba/shared";

// Normalize base URL (remove trailing slashes) to avoid // when joining paths
const API = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(
  /\/+$/,
  ""
);

// Tunable timeouts (can be overridden via env or per-call)
const DEFAULT_TIMEOUT_MS = Number(
  (import.meta as any).env?.VITE_DEFAULT_TIMEOUT_MS ?? 20000
);
const SUGGEST_TIMEOUT_MS = Number(
  (import.meta as any).env?.VITE_SUGGEST_TIMEOUT_MS ?? 45000
);
const TICK_TIMEOUT_MS = Number(
  (import.meta as any).env?.VITE_TICK_TIMEOUT_MS ?? 30000
);
const INIT_TIMEOUT_MS = Number(
  (import.meta as any).env?.VITE_INIT_TIMEOUT_MS ?? 10000
);

export class HttpError<T = unknown> extends Error {
  status: number;
  body?: T;
  constructor(status: number, message: string, body?: T) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

type RequestOpts = {
  method?: string;
  json?: any;
  formData?: FormData;
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
};

export async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const { method = "GET", json, formData, signal, timeoutMs, headers = {} } = opts;
  const effectiveTimeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const onAbort = () => controller.abort((signal as any)?.reason as any);
  signal?.addEventListener("abort", onAbort);
  const timer = setTimeout(() => controller.abort("timeout" as any), effectiveTimeout);
  try {
    const init: RequestInit = { method, signal: controller.signal, headers: { ...headers } };
    if (json !== undefined) {
      init.body = JSON.stringify(json);
      init.headers = { "Content-Type": "application/json", ...init.headers };
    } else if (formData) {
      init.body = formData;
    }
    let res: Response;
    try {
      res = await fetch(`${API}${path}`, init);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        const reason = (controller.signal as any).reason;
        if (reason === "timeout") {
          throw new HttpError(408, "timeout", { error: "timeout", path, timeoutMs: effectiveTimeout } as any);
        }
        throw new HttpError(499, "aborted", { error: "aborted", reason } as any); // 499 Nginx style client closed
      }
      throw err;
    }
    const text = await res.text();
    let data: any = undefined;
    try { data = text ? JSON.parse(text) : undefined; } catch { /* ignore parse error */ }
    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || res.statusText || "Request failed";
      throw new HttpError(res.status, msg, data);
    }
    return data as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

export function postInit(payload: TInitPayload, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<TResponseJSON> {
  return request<TResponseJSON>("/init", {
    method: "POST",
    json: payload,
    signal: options?.signal,
    timeoutMs: options?.timeoutMs ?? INIT_TIMEOUT_MS,
  });
}

export function postSuggest(payload: any, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<TResponseJSON> {
  return request<TResponseJSON>("/suggest", {
    method: "POST",
    json: payload,
    signal: options?.signal,
    timeoutMs: options?.timeoutMs ?? SUGGEST_TIMEOUT_MS,
  });
}

export function postTick(payload: any, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<TResponseJSON> {
  // /tick endpoint unificado con /suggest en el backend
  return request<TResponseJSON>("/suggest", {
    method: "POST",
    json: payload,
    signal: options?.signal,
    timeoutMs: options?.timeoutMs ?? TICK_TIMEOUT_MS,
  });
}
