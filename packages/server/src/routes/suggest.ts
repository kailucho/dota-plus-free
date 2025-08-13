import { Router } from "express";
import OpenAI from "openai";
import type { Responses } from "openai/resources/responses";
import { sumStartingGold } from "../lib/costs.js";

const router = Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/** Tool mínima: solo devuelve `purchase_order` */
export const tools = [
  {
    type: "function",
    name: "emit_item_order",
    description: "Devuelve únicamente el orden de compra de ítems recomendado.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        hero: { type: "string" },
        role: {
          type: "string",
          enum: ["Mid", "Offlane", "Hard Carry", "Support", "Hard Support"],
        },
        rank: { type: "string" },
        patch: { type: "string" },
        enemies: { type: "array", items: { type: "string" } },
        purchase_order: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item: { type: "string" },
              why: { type: "string" },
              // Hacemos phase obligatoria y con un valor “neutral”
              phase: {
                type: "string",
                enum: ["starting", "early", "mid", "late", "situational"],
              },
            },
            // 👈 TODAS las keys en properties DEBEN estar aquí con strict: true
            required: ["item", "why", "phase"],
            additionalProperties: false,
          },
        },
      },
      required: ["hero", "role", "rank", "patch", "enemies", "purchase_order"],
      additionalProperties: false,
    },
  },
] satisfies Responses.Tool[];

/** POST /suggest
 * Body:
 * { hero: "Abaddon", role: "Hard Support", rank: "Ancient", patch: "7.39d", enemies: ["Void","Sniper",...] }
 */
router.post("/suggest", async (req, res) => {
  try {
    console.log({ reqBody: req.body });
    const { hero, role, rank, patch, enemies } = req.body || {};

    // Validación mínima antes de gastar en la API
    if (
      !hero ||
      !role ||
      !rank ||
      !patch ||
      !Array.isArray(enemies) ||
      enemies.length === 0
    ) {
      return res.status(400).json({
        error: "bad_request",
        detail: "hero, role, rank, patch y enemies[] son requeridos",
      });
    }

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
    - late (25+): mejoras/alargadores (Greaves, Pipe, Halberd, Shiva's).
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

    Objetivo:
    Devuelve el orden de compra de ítems (purchase_order) apropiado para ${hero} ${role} en este matchup.
    Cada entrada: { item, why, phase } con phase ∈ {starting, early, mid, late, situational}.
    El 'starting' debe venir expandido en ítems individuales (p.ej., "Tango x2", "Wind Lace"). Justificación breve en "why".
    Presupuesto de starting: 625 oro. No lo superes. 
    Si el set propuesto excede, reemplaza por alternativas más baratas (p. ej. Salve→Tangos, menos Sentry, 1 Branch).`;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.1, // más estable
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      tools,
    });

    // En Responses API, puede venir como 'function_call' (más común) o 'tool_call' según versión.
    const out = response.output ?? [];
    const fn =
      out.find(
        (it: any) =>
          it?.type === "function_call" && it?.name === "emit_item_order"
      ) ??
      out.find(
        (it: any) => it?.type === "tool_call" && it?.name === "emit_item_order"
      );

    if (!fn) {
      return res.status(502).json({ error: "no_tool_call", detail: response });
    }

    // arguments puede venir como string JSON o como objeto
    const args =
      typeof (fn as any).arguments === "string"
        ? JSON.parse((fn as any).arguments)
        : (fn as any).arguments;

    // Opcional: validación mínima de salida (que exista purchase_order)
    if (!args?.purchase_order || !Array.isArray(args.purchase_order)) {
      return res.status(502).json({ error: "bad_tool_args", detail: args });
    }

    const STARTING_BUDGET = 625;
    const total = sumStartingGold(args.purchase_order);

    if (total > STARTING_BUDGET) {
      // Opción 1: pedir corrección al modelo (recomendado)
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
      const out2 = fix.output ?? [];
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
        if (total2 <= STARTING_BUDGET) return res.json(args2);
      }
      // Opción 2: si no lo arregla, responde con error claro
      return res.status(422).json({
        error: "starting_budget_exceeded",
        detail: {
          total,
          budget: STARTING_BUDGET,
          purchase_order: args.purchase_order,
        },
      });
    }

    // Devolvemos solo lo necesario al front
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

export default router;
