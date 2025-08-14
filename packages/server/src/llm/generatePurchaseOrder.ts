import callWithTools from "./callWithTools.js";
import { buildSuggestPrompt } from "./promptBuilders.js";
import { PurchaseRow } from "./purchaseOrderHelpers.js";
import type { Responses } from "openai/resources/responses";

export interface EnemyStatusRow {
  hero: string;
  level?: number;
  kda?: { k: number; d: number; a: number };
}

export interface MyStatusRow {
  level?: number;
  kda?: { k?: number; d?: number; a?: number };
}

export interface GeneratePurchaseOrderParams {
  hero: string;
  role: string;
  rank: string;
  patch: string;
  enemies: string[];
  minute?: number;
  enemyStatus?: EnemyStatusRow[];
  myStatus?: MyStatusRow;
  tools: Responses.Tool[];
}

export interface GeneratePurchaseOrderResult {
  purchase_order: PurchaseRow[];
}

function buildUserAugmented(
  baseUser: string,
  minute?: number,
  enemyStatus?: EnemyStatusRow[],
  myStatus?: MyStatusRow
): string {
  const lines: string[] = [baseUser.trim()];
  if (minute != null) {
    lines.push(
      `Minuto actual: ${minute}. Ajusta fases según minuto: starting (0-5), early (≤12), mid (12-25), late (>25); situational solo counters.`
    );
  }
  if (myStatus && (myStatus.level != null || myStatus.kda)) {
    const parts: string[] = [];
    if (myStatus.level != null) parts.push(`lvl ${myStatus.level}`);
    if (myStatus.kda && (myStatus.kda.k != null || myStatus.kda.d != null || myStatus.kda.a != null)) {
      const k = myStatus.kda.k ?? 0;
      const d = myStatus.kda.d ?? 0;
      const a = myStatus.kda.a ?? 0;
      parts.push(`K/D/A ${k}/${d}/${a}`);
    }
    if (parts.length) lines.push(`Mi estado: ${parts.join(" | ")}`);
  }
  if (enemyStatus && enemyStatus.length) {
    const statusLines = enemyStatus.map((r) => {
      const kda = r.kda ? ` ${r.kda.k}/${r.kda.d}/${r.kda.a}` : "";
      const lvl = r.level != null ? ` lvl${r.level}` : "";
      return `- ${r.hero}${lvl}${kda}`;
    });
    lines.push("Enemy status:");
    lines.push(...statusLines);
  }
  return lines.join("\n");
}

function buildPrompts(params: {
  patch: string;
  hero: string;
  role: string;
  rank: string;
  enemies: string[];
  minute?: number;
  enemyStatus?: EnemyStatusRow[];
  myStatus?: MyStatusRow;
}): { developer: string; user: string } {
  const { patch, hero, role, rank, enemies, minute, enemyStatus, myStatus } = params;
  const { developer, user: baseUser } = buildSuggestPrompt({
    patch,
    hero,
    role,
    rank,
    enemies,
  });
  return { developer, user: buildUserAugmented(baseUser, minute, enemyStatus, myStatus) };
}

export async function generatePurchaseOrder(
  params: GeneratePurchaseOrderParams
): Promise<GeneratePurchaseOrderResult> {
  const { hero, role, rank, patch, enemies, minute, enemyStatus, myStatus, tools } =
    params;
  const { developer, user } = buildPrompts({
    patch,
    hero,
    role,
    rank,
    enemies,
    minute,
    enemyStatus,
    myStatus,
  });

  const { toolCall } = await callWithTools({
    developer,
    user,
    tools,
  });

  const argsPrimary = JSON.parse((toolCall as any)?.arguments);

  return {
    purchase_order: argsPrimary?.purchase_order,
  };
}

export default generatePurchaseOrder;
