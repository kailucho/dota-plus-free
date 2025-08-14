import OpenAI from "openai";

// Nota: evitamos usar http.Agent personalizado porque en algunos entornos
// (edge / fetch polyfill) el socket subyacente no expone setTimeout y provoca
// errores tipo "this.socket.setTimeout is not a function" dentro del SDK.
// Node >=18 ya trae un fetch con keep-alive razonable.

// Centralized OpenAI client. Timeout se maneja vía AbortController a nivel
// de capa superior si es necesario. Aquí mantenemos configuración mínima
// para máxima compatibilidad (GitHub Actions / Pages preview, etc.).
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 60_000);

const baseConfig: any = {
  apiKey: process.env.OPENAI_API_KEY!,
};

// Solo añadimos timeout si estamos claramente en entorno Node (no edge)
// para evitar que el SDK intente acceder a propiedades inexistentes.
if (typeof process !== "undefined" && process?.versions?.node) {
  baseConfig.timeout = OPENAI_TIMEOUT_MS;
}

export const openaiClient = new OpenAI(baseConfig);

if (!process.env.OPENAI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[openaiClient] OPENAI_API_KEY no definido – las peticiones fallarán.");
}

export default openaiClient;
