// web/src/lib/itemImages.ts
import { ITEM_SLUG } from "../data/item-slugs";
const CDN = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items";
// Normaliza nombre: quita fase, cantidades, etc.
function cleanPrettyName(name) {
    let s = (name || "").trim();
    // quita prefijos/etiquetas de fase (e.g. "situational: Ghost Scepter")
    s = s.replace(/^(starting|early|mid|late|core|situational)\s*[:\-\._]\s*/i, "");
    // quita prefijos tipo "situational_" o "starting-"
    s = s.replace(/^(starting|early|mid|late|core|situational)[_\-\s]+/i, "");
    // quita sufijo de cantidad " x2"
    s = s.replace(/\sx\d+$/i, "");
    return s.trim();
}
// Alias útiles cuando el LLM acorta o varía el nombre
const ALIAS = {
    "raindrops": "Infused Raindrops",
    "infused raindrop": "Infused Raindrops",
    // añade aquí los que veas en logs
};
export function dotaItemImgUrl(prettyName) {
    const cleaned = cleanPrettyName(prettyName);
    const keyed = ALIAS[cleaned.toLowerCase()] ?? cleaned;
    // 1) mapa oficial (dotaconstants genera: "Ghost Scepter" -> "ghost")
    let slug = ITEM_SLUG[keyed];
    // 2) fallback slugify si no está en el mapa
    if (!slug) {
        slug = keyed
            .toLowerCase()
            .replace(/['’]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "");
    }
    // sanea por si viniera con .png o ?t=...
    slug = slug.split("?")[0].replace(/\.png$/i, "").replace(/_lg$/i, "");
    return `${CDN}/${slug}_lg.png`;
}
