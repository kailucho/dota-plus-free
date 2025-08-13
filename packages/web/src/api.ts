import type { TInitPayload, TTickPayload, TResponseJSON } from "@dba/shared";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

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
  const { method = "GET", json, formData, signal, timeoutMs = 20000, headers = {} } = opts;
  const controller = new AbortController();
  const onAbort = () => controller.abort(signal?.reason as any);
  signal?.addEventListener("abort", onAbort);
  const timer = setTimeout(() => controller.abort("timeout" as any), timeoutMs);
  try {
    const init: RequestInit = { method, signal: controller.signal, headers: { ...headers } };
    if (json !== undefined) {
      init.body = JSON.stringify(json);
      init.headers = { "Content-Type": "application/json", ...init.headers };
    } else if (formData) {
      init.body = formData;
    }
    const res = await fetch(`${API}${path}`, init);
    const text = await res.text();
    let data: any = undefined;
    try { data = text ? JSON.parse(text) : undefined; } catch { /* ignore parse error */ }
    if (!res.ok) {
      const msg = (data && (data.message || data.error)) || res.statusText || "Request failed";
      throw new HttpError(res.status, msg, data);
    }
    return (data as T);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

export function postInit(payload: TInitPayload, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<TResponseJSON> {
  return request<TResponseJSON>("/init", { method: "POST", json: payload, signal: options?.signal, timeoutMs: options?.timeoutMs });
}

export function postSuggest(payload: TInitPayload, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<TResponseJSON> {
  return request<TResponseJSON>("/suggest", { method: "POST", json: payload, signal: options?.signal, timeoutMs: options?.timeoutMs });
}

export function postTick(payload: TTickPayload, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<TResponseJSON> {
  return request<TResponseJSON>("/tick", { method: "POST", json: payload, signal: options?.signal, timeoutMs: options?.timeoutMs });
}