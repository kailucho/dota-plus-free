import { Router } from "express";
import multer from "multer";
import OpenAI from "openai";
import type { Responses } from "openai/resources/responses";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const router = Router();

// JSON Schema de salida (solo lo pedido por el front para cada enemigo)
const extractSchema = {
  type: "object",
  properties: {
    enemy_status: {
      type: "array",
      items: {
        type: "object",
        properties: {
          hero: { type: "string" },
          level: { type: "integer" },
          kda: {
            type: "object",
            properties: {
              k: { type: "integer" },
              d: { type: "integer" },
              a: { type: "integer" },
            },
            // Con strict: true, required debe listar todas las keys de properties
            required: ["k", "d", "a"],
            additionalProperties: false,
          },
          has_scepter: { type: "boolean" },
          has_shard: { type: "boolean" },
          talents: { type: "array", items: { type: "string" } },
        },
        required: ["hero"],
        additionalProperties: false,
      },
    },
  },
  required: ["enemy_status"],
  additionalProperties: false,
} as const;

// Herramienta de salida estructurada (similar a /suggest)
export const extractTools = [
  {
    type: "function",
    name: "emit_tick_extract",
    description:
      "Devuelve los datos extraídos del screenshot en formato estructurado.",
    strict: false,
    parameters: extractSchema,
  },
] satisfies Responses.Tool[];

router.post("/tick/extract", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no_image" });
    console.log("req.body", req.body);
    // hints opcionales: soporta múltiples formas de enviar enemies
    const enemies: string[] = [];
    // 1) Array directo: enemies: ["Void", ...]
    if (Array.isArray((req.body as any).enemies)) {
      enemies.push(
        ...((req.body as any).enemies as any[]).map((v) => String(v))
      );
    } else if (typeof (req.body as any).enemies === "string") {
      // 2) String JSON o CSV simple
      const raw = String((req.body as any).enemies);
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) enemies.push(...arr.map((v) => String(v)));
        else {
          // Si no es JSON array, interpreta como CSV
          raw
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
            .forEach((s) => enemies.push(s));
        }
      } catch {
        raw
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((s) => enemies.push(s));
      }
    }
    // 3) Campos bracketed: enemies[0]=..., enemies[1]=...
    Object.keys(req.body).forEach((k) => {
      const m = /^enemies\[(\d+)\]$/.exec(k);
      if (m) enemies.push(String((req.body as any)[k]));
    });
    // 4) Repetidos tipo enemies[]=...
    Object.keys(req.body).forEach((k) => {
      if (k === "enemies[]") enemies.push(String((req.body as any)[k]));
    });
    // Normaliza: trim y dedup
    const seen = new Set<string>();
    const enemiesNorm = enemies
      .map((e) => e.trim())
      .filter(
        (e) =>
          e.length > 0 &&
          (seen.has(e.toLowerCase())
            ? false
            : (seen.add(e.toLowerCase()), true))
      );

    // convierte a base64 data URL
    const b64 = req.file.buffer.toString("base64");
    const dataUrl = `data:${req.file.mimetype};base64,${b64}`;

    const system = `
    Eres un extractor de datos de Dota 2. Recibirás un screenshot de la tabla de héroes.

    Devuelve SOLO para los héroes ENEMIGOS de la lista de entrada:
    - hero (string): igual a la lista.
    - level (integer): columna "LVL".
    - kda {k,d,a}: columnas "K","D","A" en ese orden.

    REGLAS:
    - Mapea K→k, D→d, A→a exactamente.
    - Limita la salida a los héroes de la lista (normaliza mayúsculas/minúsculas).
    - Si K/D/A no se ven con claridad, omite toda la clave "kda".

    Devuelve la salida llamando a "emit_tick_extract" con el schema indicado.
    `;

    const hints = [
      enemiesNorm.length
        ? `Enemigos esperados (restringe la salida a estos): ${enemiesNorm.join(
            ", "
          )}`
        : null,
      null,
    ]
      .filter(Boolean)
      .join("\n");

    const response = await client.responses.create({
      model: "gpt-4.1",
      temperature: 0,
      input: [
        { role: "system", content: system },
        { role: "user", content: `Extrae datos del screenshot.\n${hints}` },
        {
          role: "user",
          content: [{ type: "input_image", image_url: dataUrl }] as any,
        },
      ],
      tools: extractTools,
    });

    // Extrae la llamada a la función con los datos estructurados
    const out = (response as any).output ?? [];
    const fn =
      out.find(
        (it: any) =>
          it?.type === "function_call" && it?.name === "emit_tick_extract"
      ) ??
      out.find(
        (it: any) =>
          it?.type === "tool_call" && it?.name === "emit_tick_extract"
      );

    if (!fn) {
      return res.status(502).json({ error: "no_tool_call", detail: response });
    }

    const args =
      typeof (fn as any).arguments === "string"
        ? JSON.parse((fn as any).arguments)
        : (fn as any).arguments;
    const json = args || {};

    // Normaliza héroes detectados vs lista enemies y restringe a esa lista en ese orden
    if (Array.isArray(json.enemy_status) && enemiesNorm.length) {
      const normalized = json.enemy_status.map((r: any) => {
        const h = String(r.hero || "");
        const match =
          enemiesNorm.find((e) => e.toLowerCase() === h.toLowerCase()) ??
          enemiesNorm.find((e) => h.toLowerCase().includes(e.toLowerCase()));
        return { ...r, hero: match || r.hero };
      });
      const byHero = new Map<string, any>();
      for (const r of normalized) {
        if (r?.hero) byHero.set(String(r.hero).toLowerCase(), r);
      }
      // Devuelve solo los enemigos enviados que se hayan encontrado en la imagen (sin placeholders)
      const found = enemiesNorm
        .map((e) => byHero.get(e.toLowerCase()))
        .filter((v: any) => !!v);

      // Normaliza tipos y agrega claves; sin defaults para scepter/shard/talents
      json.enemy_status = found.map((r: any) => {
        const out: any = { hero: String(r.hero) };
        // level
        if (r.level !== undefined && r.level !== null && r.level !== "") {
          const n = Number(r.level);
          if (Number.isFinite(n)) out.level = Math.max(0, Math.trunc(n));
        }
        // kda
        if (r.kda && typeof r.kda === "object") {
          const k = Number((r.kda as any).k);
          const d = Number((r.kda as any).d);
          const a = Number((r.kda as any).a);
          if ([k, d, a].every((x) => Number.isFinite(x))) {
            out.kda = {
              k: Math.max(0, Math.trunc(k)),
              d: Math.max(0, Math.trunc(d)),
              a: Math.max(0, Math.trunc(a)),
            };
          }
        }
        // scepter/shard: incluir solo si vienen desde el modelo
        if (typeof r.has_scepter === "boolean") out.has_scepter = r.has_scepter;
        if (typeof r.has_shard === "boolean") out.has_shard = r.has_shard;
        // talents: incluir solo si vienen desde el modelo
        if (Array.isArray(r.talents)) {
          const talents = (r.talents as any[])
            .map((t) => String(t).trim())
            .filter(Boolean);
          if (talents.length) out.talents = talents;
        }
        return out;
      });
    }

    return res.json(json);
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "ocr_failed", detail: String(err?.message || err) });
  }
});

export default router;
