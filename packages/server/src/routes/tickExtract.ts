import { Router } from "express";
import type { Responses } from "openai/resources/responses";
import callWithTools from "../llm/callWithTools.js";

// Eliminado multer/upload: ya no se procesa multipart aquí; solo JSON base64.
import { EMIT_ITEM_ORDER } from "../llm/purchaseOrderHelpers.js";
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
    name: EMIT_ITEM_ORDER,
    description:
      "Devuelve los datos extraídos del screenshot en formato estructurado.",
    strict: false,
    parameters: extractSchema,
  },
] satisfies Responses.Tool[];

// Nuevo modo: aceptar JSON { image_b64: "data:...base64...", enemies: [...]}.
// También se mantiene compatibilidad con multipart (campo image) temporalmente.
router.post("/tick/extract", async (req, res) => {
  try {
    // Detecta si viene base64 por JSON
    let b64Image: string | null = null;
    const body: any = req.body || {};
    if (body.image_b64 && typeof body.image_b64 === "string") {
      // Acepta tanto data URL completa como solo la parte base64 (asume image/png)
      if (body.image_b64.startsWith("data:")) {
        b64Image = body.image_b64;
      } else if (/^[A-Za-z0-9+/=]+$/.test(body.image_b64)) {
        b64Image = `data:image/png;base64,${body.image_b64}`;
      }
    }

  // Ya no se acepta multipart (req.file); únicamente JSON con image_b64.

    if (!b64Image) return res.status(400).json({ error: "no_image" });
    console.log("/tick/extract body keys", Object.keys(body));
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

    // b64Image ya preparado arriba

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

    const developer = `Rol developer (máxima prioridad):
${system.trim()}
REGLAS ADICIONALES:
1. Responde SOLO con una llamada a emit_tick_extract.
2. Sin texto libre fuera de la function call.
3. No inventes héroes que no estén en la lista proporcionada.
`;

    const { toolCall } = await callWithTools({
      developer,
      user: `Extrae datos del screenshot.\n${hints}`,
      tools: extractTools,
      b64Image: b64Image,
    });
    const json = JSON.parse((toolCall as any)?.arguments);

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
