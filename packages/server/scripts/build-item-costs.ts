// npx tsx packages/server/scripts/build-item-costs.ts
import fs from "node:fs";
import path from "node:path";

const SRC = "https://raw.githubusercontent.com/odota/dotaconstants/master/build/items.json";
const OUT = path.resolve(process.cwd(), "packages/server/src/data/item-costs.ts");

type Item = { dname?: string; cost?: number; img?: string };

(async () => {
  const r = await fetch(SRC);
  if (!r.ok) { console.error("Descarga falló:", r.status); process.exit(1); }
  const data = (await r.json()) as Record<string, Item>;

  const map: Record<string, number> = {};
  for (const k of Object.keys(data)) {
    const it = data[k];
    if (!it?.dname || typeof it.cost !== "number") continue;
    map[it.dname] = it.cost;
  }

  const file =
`// AUTO-GENERATED from dotaconstants (items.json)
export const ITEM_COST: Record<string, number> = ${JSON.stringify(map, null, 2)} as const;
`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, file, "utf8");
  console.log("OK costs →", OUT, "items:", Object.keys(map).length);
})();
