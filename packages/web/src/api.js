const API = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
export class HttpError extends Error {
    constructor(status, message, body) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.body = body;
    }
}
export async function request(path, opts = {}) {
    const { method = "GET", json, formData, signal, timeoutMs = 20000, headers = {} } = opts;
    const controller = new AbortController();
    const onAbort = () => controller.abort(signal?.reason);
    signal?.addEventListener("abort", onAbort);
    const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
    try {
        const init = { method, signal: controller.signal, headers: { ...headers } };
        if (json !== undefined) {
            init.body = JSON.stringify(json);
            init.headers = { "Content-Type": "application/json", ...init.headers };
        }
        else if (formData) {
            init.body = formData;
        }
        const res = await fetch(`${API}${path}`, init);
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
    return request("/init", { method: "POST", json: payload, signal: options?.signal, timeoutMs: options?.timeoutMs });
}
export function postSuggest(payload, options) {
    return request("/suggest", { method: "POST", json: payload, signal: options?.signal, timeoutMs: options?.timeoutMs });
}
export function postTick(payload, options) {
    return request("/tick", { method: "POST", json: payload, signal: options?.signal, timeoutMs: options?.timeoutMs });
}
