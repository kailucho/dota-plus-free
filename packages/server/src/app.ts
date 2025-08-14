import express from "express";
import cors from "cors";
import "dotenv/config";
import { InitPayload, sampleResponseBase } from "@dba/shared";
import suggestRouter from "./routes/suggest.js";
import tickExtract from "./routes/tickExtract.js";
// import { sumStartingGold } from "./lib/costs.js"; // retained for potential future diagnostics

export function createApp() {
  const app = express();

  // CORS: allow specific origins from env in production, or allow all by default
  const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    cors({
      // In API Gateway HTTP API, also configure CORS in serverless.yml (see provider.httpApi.cors)
      origin: allowedOrigins.length ? allowedOrigins : true, // TODO: lock to GitHub Pages origin
      credentials: true,
    })
  );
  // Aumentamos el límite para permitir imágenes en base64 (~8MB originales -> ~10.7MB base64)
  app.use(express.json({ limit: "12mb" }));

  // Healthcheck for platform load balancers & API Gateway mapping
  app.get("/health", (_req, res) => res.status(200).send("ok"));

  // Simple hello route (useful to verify CORS from GitHub Pages)
  app.get("/api/hello", (_req, res) => {
    res.json({ message: "hello from @dba/server" });
  });

  app.post("/init", (req, res) => {
    const parsed = InitPayload.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "missing_fields", details: parsed.error.flatten() });
    }
    const { hero, role } = parsed.data;
    const payload = sampleResponseBase(hero, role);
    return res.json(payload);
  });

  app.use(suggestRouter);
  app.use(tickExtract);

  return app;
}
