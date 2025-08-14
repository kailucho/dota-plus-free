import { Router } from "express";
import generatePurchaseOrder, {
  EnemyStatusRow,
  MyStatusRow,
} from "../llm/generatePurchaseOrder.js";
import { tools } from "../llm/toolsDefinitions.js";
import { NOW_PATCH } from "@dba/shared";

const router = Router();

const REQUEST_TIMEOUT_MS = 65_000;

// Incoming body can be one of the following styles:
// 1) Legacy init: { hero, role, rank, enemies[], patch? }
// 2) Legacy tick: { minute, my_status: { hero, role, rank }, enemy_status: [{ hero, level?, kda? {k,d,a} }] }
// 3) New unified (requested): {
//        minute: number,
//        my_status: { hero, role, rank, level?, kda: { kills, deaths, assists } },
//        enemy_status: [{ hero, level?, kda: { kills, deaths, assists } }]
//    }
// We keep the interfaces loose and normalize below.
interface SuggestBodyBase {
  patch?: string;
  minute?: number;
  my_status?: {
    hero?: string;
    role?: string;
    rank?: string;
    level?: number;
    kda?: {
      k?: number;
      d?: number;
      a?: number;
      kills?: number;
      deaths?: number;
      assists?: number;
    };
  };
  enemy_status?: Array<{
    hero: string;
    level?: number;
    kda?: {
      k?: number;
      d?: number;
      a?: number;
      kills?: number;
      deaths?: number;
      assists?: number;
    };
  }>;
}

// Direct tools array export (was previously buildTools())
export { tools };

router.post("/suggest", async (req, res) => {
  try {
    req.setTimeout(REQUEST_TIMEOUT_MS);
    res.setTimeout(REQUEST_TIMEOUT_MS);

    const body = (req.body || {}) as SuggestBodyBase;

    // Determine unified fields (support both original suggest shape and tick-style shape)
    const hero = body.my_status?.hero;
    const role = body.my_status?.role;
    const rank = body.my_status?.rank;
    const patch = body.patch || NOW_PATCH;
    const minute = typeof body.minute === "number" ? body.minute : undefined;

    // Enemies list precedence: explicit enemies[] > enemy_status heroes
    let enemies = (body.enemy_status || []).map((e) => e.hero);

    const enemyStatus: EnemyStatusRow[] | undefined = Array.isArray(
      body.enemy_status
    )
      ? body.enemy_status
          .filter((r) => r && r.hero)
          .map((r) => {
            let kda = r.kda as any;
            if (kda) {
              const kills = kda.kills;
              const deaths = kda.deaths;
              const assists = kda.assists;
              if (kills != null || deaths != null || assists != null) {
                kda = { k: kills ?? 0, d: deaths ?? 0, a: assists ?? 0 };
              } else {
                kda = undefined;
              }
            }
            return { hero: r.hero, level: r.level, kda } as EnemyStatusRow;
          })
      : undefined;

    const myStatus: MyStatusRow | undefined = body.my_status
      ? (() => {
          const kdaIn = body.my_status?.kda;
          let kda: any = undefined;
          if (kdaIn) {
            const k = kdaIn.k ?? kdaIn.kills;
            const d = kdaIn.d ?? kdaIn.deaths;
            const a = kdaIn.a ?? kdaIn.assists;
            if (k != null || d != null || a != null) {
              kda = { k: k ?? 0, d: d ?? 0, a: a ?? 0 };
            }
          }
          return { level: body.my_status.level, kda };
        })()
      : undefined;

    if (!hero || !role || !rank || enemies.length === 0) {
      return res.status(400).json({
        error: "bad_request",
        detail:
          "hero, role, rank y enemies[] (o enemy_status[]) son requeridos",
      });
    }

    const result = await generatePurchaseOrder({
      hero,
      role,
      rank,
      patch,
      enemies,
      minute,
      enemyStatus,
      myStatus,
      tools,
    });
    return res.json({
      hero,
      role,
      rank,
      patch,
      enemies,
      minute,
      purchase_order: result.purchase_order,
    });
  } catch (err: any) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "openai_failed", detail: String(err?.message || err) });
  }
});

export default router;
