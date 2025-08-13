import { ITEM_COST } from "../data/item-costs.js";

export function baseName(name: string) {
  return (name || "").replace(/\sx\d+$/i, "").trim();
}
export function qtyOf(name: string) {
  const m = /\sx(\d+)$/i.exec(name || "");
  return m ? Math.max(1, parseInt(m[1], 10)) : 1;
}
export function itemCost(pretty: string): number {
  const base = baseName(pretty);
  const unit = ITEM_COST[base] ?? 0;
  return unit * qtyOf(pretty);
}
export function sumStartingGold(purchase_order: Array<{item:string; phase:string}>): number {
  return purchase_order
    .filter(r => r.phase?.toLowerCase() === "starting")
    .reduce((acc, r) => acc + itemCost(r.item), 0);
}
