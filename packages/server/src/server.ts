import express from "express";
import cors from "cors";
import "dotenv/config";
import OpenAI from "openai";
import { InitPayload, NOW_PATCH, sampleResponseBase } from "@dba/shared";
import suggestRouter, { tools } from "./routes/suggest.js";
import tickExtract from "./routes/tickExtract.js";
import { sumStartingGold } from "./lib/costs.js";

const app = express();

// CORS: allow specific origins from env in production, or allow all by default
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  })
);
app.use(express.json());

// Healthcheck for platform load balancers
app.get("/health", (_req, res) => res.status(200).send("ok"));

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

// OpenAI client for LLM-powered suggestions in /tick
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

app.post("/tick", async (req, res) => {
  try {
    // Accept a lightweight tick payload and derive suggestion inputs
    const { my_status, enemy_status } = req.body || {};
    const minute: number | undefined =
      typeof req.body?.minute === "number"
        ? req.body.minute
        : req.body?.minute != null
        ? Number(req.body.minute)
        : undefined;
    const hero = my_status?.hero;
    const role = my_status?.role;
    const rank = my_status?.rank;
    const patch = NOW_PATCH;
    const enemies: string[] = Array.isArray(enemy_status)
      ? enemy_status.map((e: any) => e?.hero).filter(Boolean)
      : Array.isArray(req.body?.enemies)
      ? req.body.enemies
      : [];

    // Minimal validation
    if (!hero || !role || !rank || !patch || enemies.length === 0) {
      return res.status(400).json({
        error: "bad_request",
        detail:
          "my_status.hero, my_status.role, my_status.rank y enemy_status[].hero (o enemies[]) son requeridos",
      });
    }

    // Reuse the same guidance as /suggest to return identical shape
    const SYSTEM_GUIDE = `
    Para phase = "starting":
    - Presupuesto total MÁXIMO: 625 de oro. No lo excedas.
    - NO devuelvas kits/paquetes. Devuelve ítems individuales.
    - Si un ítem es múltiple, escribe "Tango x2", "Iron Branch x2", etc.
    - "why" breve (8-16 palabras) explicando motivo (sustain, movilidad, visión, etc.).

    Fases válidas y orientación:
    - starting (0-5): consumibles, visión, movilidad barata.
    - early (5-12): botas, stick/wand, primeros utility (Raindrops, etc.).
    - mid (12-25): utilidades clave (Glimmer/Force, auras, Eul, Lotus, Blink).
    - late (25+): mejoras/alargadores (Greaves, Pipe, Halberd, Shiva’s).
    - situational: counters específicos del matchup.

    Devuelve SOLO una llamada a la función emit_item_order con el arreglo purchase_order.
    `;

    const system = `Eres un coach experto en Dota 2 (parche ${patch}). ${SYSTEM_GUIDE}`;

    const user = `Datos:
    - Hero: ${hero}
    - Role: ${role}
    - Rank: ${rank}
    - Patch: ${patch}
    - Enemies: ${enemies.join(", ")}
    - Minuto actual: ${minute ?? "(no especificado)"}

    Objetivo:
    Devuelve el orden de compra de ítems (purchase_order) apropiado para ${hero} ${role} en este matchup.
    Cada entrada: { item, why, phase } con phase ∈ {starting, early, mid, late, situational}.
    Considera el minuto actual para priorizar fases: early <12, mid 12-25, late >25.`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.1,
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools,
    });

    const out = (response as any).output ?? [];
    const fn =
      out.find(
        (it: any) =>
          it?.type === "function_call" && it?.name === "emit_item_order"
      ) ??
      out.find(
        (it: any) => it?.type === "tool_call" && it?.name === "emit_item_order"
      );

    if (!fn)
      return res.status(502).json({ error: "no_tool_call", detail: response });

    const args =
      typeof (fn as any).arguments === "string"
        ? JSON.parse((fn as any).arguments)
        : (fn as any).arguments;
    if (!args?.purchase_order || !Array.isArray(args.purchase_order)) {
      return res.status(502).json({ error: "bad_tool_args", detail: args });
    }

    const STARTING_BUDGET = 625;
    const total = sumStartingGold(args.purchase_order);
    if (total > STARTING_BUDGET) {
      const fixMsg = `Tu starting cuesta ${total} (>625). Ajusta los ítems de 'starting' para no superar 625 conservando movilidad/visión/sustain. Devuelve SOLO emit_item_order.`;
      const fix = await client.responses.create({
        model: "gpt-4.1-mini",
        temperature: 0.1,
        input: [
          { role: "system", content: `${system}\n\n${SYSTEM_GUIDE}` },
          { role: "user", content: user },
          { role: "assistant", content: JSON.stringify(args) },
          { role: "user", content: fixMsg },
        ],
        tools,
      });
      const out2 = (fix as any).output ?? [];
      const fn2 = out2.find(
        (it: any) =>
          (it.type === "function_call" || it.type === "tool_call") &&
          it.name === "emit_item_order"
      );
      const args2 =
        typeof (fn2 as any)?.arguments === "string"
          ? JSON.parse((fn2 as any).arguments)
          : (fn2 as any)?.arguments;
      if (args2) {
        const total2 = sumStartingGold(args2.purchase_order || []);
        if (total2 <= STARTING_BUDGET) {
          return res.json({
            hero: args2.hero,
            role: args2.role,
            rank: args2.rank,
            patch: args2.patch,
            enemies: args2.enemies,
            purchase_order: args2.purchase_order,
          });
        }
      }
      return res.status(422).json({
        error: "starting_budget_exceeded",
        detail: {
          total,
          budget: STARTING_BUDGET,
          purchase_order: args.purchase_order,
        },
      });
    }

    // Match /suggest response shape
    return res.json({
      hero: args.hero,
      role: args.role,
      rank: args.rank,
      patch: args.patch,
      enemies: args.enemies,
      purchase_order: args.purchase_order,
    });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "openai_failed", detail: String(err?.message || err) });
  }
});

app.use(suggestRouter);
app.use(tickExtract);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
