// Node 18+
// npx tsx packages/server/scripts/build-item-slugs.ts
import fs from "node:fs";
import path from "node:path";

const OUT_FILE = path.resolve(
  process.cwd(),
  "packages/web/src/data/item-slugs.ts"
);
const SRC =
  "https://raw.githubusercontent.com/odota/dotaconstants/master/build/items.json";

type DotaconstItem = {
  id: number;
  dname?: string; // pretty name, ej: "Blink Dagger"
  img?: string; // ej: "/apps/dota2/images/items/blink_lg.png"
};

(async () => {
  console.log("Descargando items.json de dotaconstants…");
  const r = await fetch(SRC);
  if (!r.ok) {
    console.error("Error al descargar:", r.status, await r.text());
    process.exit(1);
  }
  const data = (await r.json()) as Record<string, DotaconstItem>;

  const map: Record<string, string> = {};
  for (const key of Object.keys(data)) {
    const it = data[key];
    if (!it?.dname || !it?.img) continue;
    const pathNoQuery = it.img.split("?")[0]; // 🔧 quita ?t=...
    const filename = pathNoQuery.split("/").pop() || "";
    const slug = filename
      .replace(/_lg\.png$/i, "") // quita sufijo grande
      .replace(/\.png$/i, "");
    if (slug) map[it.dname] = slug;
  }

  const header =
    `// AUTO-GENERATED from dotaconstants (items.json)\n` +
    `// Fuente de imágenes: Valve CDN\n\n` +
    `export const ITEM_SLUG: Record<string, string> = ${JSON.stringify(
      map,
      null,
      2
    )} as const;\n`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, header, "utf8");
  console.log(`OK: ${Object.keys(map).length} ítems -> ${OUT_FILE}`);
})();
