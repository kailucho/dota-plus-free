import { z } from "zod";

export const NOW_PATCH = "7.39d" as const;

export const RoleEnum = z.enum(["Mid", "Offlane", "Hard Carry", "Support", "Hard Support"]);

// Linear purchase order support
export const PurchasePhase = z.enum(["starting", "early", "core", "situational"]);
export type TPurchasePhase = z.infer<typeof PurchasePhase>;

export const PurchaseOrderItem = z.object({
  item: z.string(),
  why: z.string(),
  phase: PurchasePhase
});
export type TPurchaseOrderItem = z.infer<typeof PurchaseOrderItem>;

export const InitPayload = z.object({
  rank: z.string(),
  hero: z.string(),
  role: RoleEnum,
  enemies: z.array(z.string()).length(5),
  patch: z.string().optional(),
  constraints: z.string().optional(),
  region_meta: z.string().optional()
});
export type TInitPayload = z.infer<typeof InitPayload>;

export const KDASchema = z.object({ k: z.number().int().min(0), d: z.number().int().min(0), a: z.number().int().min(0) });

export const TickPayload = z.object({
  minute: z.number().int().nonnegative(),
  my_status: z.object({
    level: z.number().int().min(1).max(30),
    gold: z.number().int().min(0),
    kda: KDASchema,
    items: z.array(z.string()),
    facet: z.string().optional(),
    talents: z.array(z.string()).optional()
  }),
  enemy_status: z.array(z.object({
    hero: z.string(),
    level: z.number().int().min(1).max(30).optional(),
    kda: KDASchema.optional(),
    items: z.array(z.string()).optional(),
    facet: z.string().optional(),
    talents: z.array(z.string()).optional()
  })).optional(),
  objectives: z.object({
    towers: z.object({ ally: z.number().int().min(0), enemy: z.number().int().min(0) }),
    barracks: z.object({ ally: z.number().int().min(0), enemy: z.number().int().min(0) }),
    roshan: z.enum(["alive", "dead", "timer"]).optional()
  }).optional(),
  team_econ: z.object({ networth_diff: z.number(), xp_diff: z.number() }).optional(),
  lane_state: z.string().optional(),
  notes: z.string().optional()
});
export type TTickPayload = z.infer<typeof TickPayload>;

export const ResponseJSON = z.object({
  version: z.literal("1.0"),
  patch: z.string(),
  hero: z.string(),
  role: RoleEnum,
  phase: z.enum(["early", "mid", "late"]),
  threats: z.array(z.object({
    hero: z.string(),
    type: z.enum(["magic", "physical", "control", "push", "global", "sustain"]),
    score: z.number().min(0).max(100),
    note: z.string()
  })),
  facet_recommendation: z.object({ facet: z.string(), why: z.string() }),
  skill_build: z.object({
    order: z.array(z.string()),
    talents: z.array(z.object({ level: z.number(), pick: z.enum(["LEFT","RIGHT"]).or(z.string()), why: z.string() }))
  }),
  item_build: z.object({
    starting: z.array(z.object({ item: z.string(), why: z.string() })),
    early: z.array(z.object({ item: z.string(), why: z.string() })),
    core: z.array(z.object({ item: z.string(), why: z.string(), priority: z.number().min(1).max(3) })),
    situational: z.array(z.object({ item: z.string(), why: z.string(), when: z.string() })),
    consumables: z.array(z.string())
  }),
  // Optional linear representation of purchase order
  purchase_order: z.array(PurchaseOrderItem).optional(),
  live_adjustments: z.array(z.object({ minute_gte: z.number(), change: z.string(), reason: z.string() })),
  playstyle_tips: z.array(z.object({ focus: z.string(), tip: z.string() })),
  confidence: z.number()
});
export type TResponseJSON = z.infer<typeof ResponseJSON>;

export function sampleResponseBase(hero: string, role: z.infer<typeof RoleEnum>): TResponseJSON {
  return {
    version: "1.0",
    patch: NOW_PATCH,
    hero,
    role,
    phase: "early",
    threats: [
      { hero: "ExampleThreat1", type: "control", score: 78, note: "Setups peligrosos en midgame" },
      { hero: "ExampleThreat2", type: "magic", score: 66, note: "Burst mágico temprano" },
      { hero: "ExampleThreat3", type: "push", score: 58, note: "Presión de estructuras" }
    ],
    facet_recommendation: { facet: "[Facet adecuada segun 7.39d]", why: "Sinergia con tu rol y composición" },
    skill_build: {
      order: ["Q","W","E","Q","Q","R","E","E","W","W","R","E","W","Q","Stats","R"],
      talents: [ { level: 10, pick: "LEFT", why: "Pico de poder temprano vs composición actual" } ]
    },
    item_build: {
      starting: [ { item: "Branches", why: "Eficiencia de stats/slot" }, { item: "Tango", why: "Sustain de línea" } ],
      early: [ { item: "Boots", why: "Tempo y posicionamiento" } ],
      core: [
        { item: "ItemCore1", why: "Poder pico según amenazas", priority: 1 },
        { item: "ItemCore2", why: "Mitiga burst/control enemigo", priority: 2 }
      ],
      situational: [ { item: "ItemSituacional1", why: "Counter directo a X", when: "si héroe enemigo compra Orchid" } ],
      consumables: ["SMOKE","CLARITY"]
    },
    purchase_order: [
      { item: "Tango", why: "Sustain de línea", phase: "starting" },
      { item: "Branches", why: "Eficiencia de stats/slot", phase: "starting" },
      { item: "Boots", why: "Tempo y posicionamiento", phase: "early" },
      { item: "ItemCore1", why: "Poder pico según amenazas", phase: "core" },
      { item: "ItemCore2", why: "Mitiga burst/control enemigo", phase: "core" },
      { item: "ItemSituacional1", why: "Counter directo a X", phase: "situational" }
    ],
    live_adjustments: [ { minute_gte: 12, change: "Prioriza ItemCore2", reason: "Aumento de control enemigo" } ],
    playstyle_tips: [ { focus: "laning", tip: "Asegura runas/vision para tempo" } ],
    confidence: 0.85
  };
}