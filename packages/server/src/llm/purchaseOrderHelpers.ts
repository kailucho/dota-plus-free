export const EMIT_ITEM_ORDER = "emit_item_order";

export const PHASES = [
  "starting",
  "early",
  "mid",
  "late",
  "situational",
] as const;
export type Phase = (typeof PHASES)[number];

export interface PurchaseRow {
  item: string;
  why: string;
  phase: Phase;
}