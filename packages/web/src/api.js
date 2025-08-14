// Normalize base URL (remove trailing slashes) to avoid // when joining paths
const API = (import.meta.env.VITE_API_URL ?? "http://localhost:4000").replace(/\/+$/, "");
// Tunable timeouts (can be overridden via env or per-call)
const DEFAULT_TIMEOUT_MS = Number(import.meta.env?.VITE_DEFAULT_TIMEOUT_MS ?? 20000);
const SUGGEST_TIMEOUT_MS = Number(import.meta.env?.VITE_SUGGEST_TIMEOUT_MS ?? 45000);
const TICK_TIMEOUT_MS = Number(import.meta.env?.VITE_TICK_TIMEOUT_MS ?? 30000);
const INIT_TIMEOUT_MS = Number(import.meta.env?.VITE_INIT_TIMEOUT_MS ?? 10000);
export class HttpError extends Error {
    constructor(status, message, body) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.body = body;
    }
}
export async function request(path, opts = {}) {
    const { method = "GET", json, formData, signal, timeoutMs, headers = {} } = opts;
    const effectiveTimeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const onAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", onAbort);
    const timer = setTimeout(() => controller.abort("timeout"), effectiveTimeout);
    try {
        const init = { method, signal: controller.signal, headers: { ...headers } };
        if (json !== undefined) {
            init.body = JSON.stringify(json);
            init.headers = { "Content-Type": "application/json", ...init.headers };
        }
        else if (formData) {
            init.body = formData;
        }
        let res;
        try {
            res = await fetch(`${API}${path}`, init);
        }
        catch (err) {
            if (err?.name === "AbortError") {
                const reason = controller.signal.reason;
                if (reason === "timeout") {
                    throw new HttpError(408, "timeout", { error: "timeout", path, timeoutMs: effectiveTimeout });
                }
                throw new HttpError(499, "aborted", { error: "aborted", reason }); // 499 Nginx style client closed
            }
            throw err;
        }
        const text = await res.text();
        let data = undefined;
        try {
            data = text ? JSON.parse(text) : undefined;
        }
        catch { /* ignore parse error */ }
        if (!res.ok) {
            const msg = (data && (data.message || data.error)) || res.statusText || "Request failed";
            throw new HttpError(res.status, msg, data);
        }
        return data;
    }
    finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
    }
}
export function postInit(payload, options) {
    return request("/init", {
        method: "POST",
        json: payload,
        signal: options?.signal,
        timeoutMs: options?.timeoutMs ?? INIT_TIMEOUT_MS,
    });
}
export function postSuggest(payload, options) {
    return request("/suggest", {
        method: "POST",
        json: payload,
        signal: options?.signal,
        timeoutMs: options?.timeoutMs ?? SUGGEST_TIMEOUT_MS,
    });
}
export function postTick(payload, options) {
    // /tick endpoint unificado con /suggest en el backend
    return request("/suggest", {
        method: "POST",
        json: payload,
        signal: options?.signal,
        timeoutMs: options?.timeoutMs ?? TICK_TIMEOUT_MS,
    });
}
