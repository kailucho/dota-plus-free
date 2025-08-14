import OpenAI from "openai";
import http from "node:http";

// Centralized OpenAI client with keep-alive & optional timeout.
// Reused by all route helpers to avoid creating multiple TCP connections.
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 60_000);

export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  timeout: OPENAI_TIMEOUT_MS,
  // @ts-ignore Pass through to internal fetch
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
});

if (!process.env.OPENAI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn("[openaiClient] OPENAI_API_KEY no definido – las peticiones fallarán.");
}

export default openaiClient;
