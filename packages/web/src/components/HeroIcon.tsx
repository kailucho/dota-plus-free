// ./components/HeroIcon.tsx
import * as React from "react";

type Props = { name: string; size?: number; className?: string; title?: string };

const ALIASES: Record<string, string[]> = {
  // Ambiguos o con nombre "interno" de Valve
  "void": ["faceless_void", "void_spirit"],
  "doom": ["doom_bringer", "doom"],
  "lifestealer": ["life_stealer", "lifestealer"],
  "shadow fiend": ["nevermore", "shadow_fiend"],
  "queen of pain": ["queenofpain"],
  "anti-mage": ["antimage"],
  "clockwerk": ["rattletrap", "clockwerk"],
  "outworld destroyer": ["obsidian_destroyer", "outworld_destroyer"],
  "treant protector": ["treant", "treant_protector"],
  "wraith king": ["wraith_king", "skeleton_king"],
  "windranger": ["windrunner", "windranger"],
  "nature's prophet": ["furion", "natures_prophet"],
  "zeus": ["zuus", "zeus"], // por si acaso
};

function normalize(name: string) {
  return name.trim().toLowerCase();
}
function baseSlug(name: string) {
  return normalize(name)
    .replace(/['’]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function candidatesFor(name: string): string[] {
  const n = normalize(name);
  const cand = ALIASES[n] ?? [];
  const norm = baseSlug(name);
  // Evita duplicar:
  return Array.from(new Set([...cand, norm]));
}

export function HeroIcon({ name, size = 20, className = "", title }: Props) {
  const tries = React.useMemo(() => candidatesFor(name), [name]);
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => setIdx(0), [name]); // al cambiar héroe, reinicia

  if (idx >= tries.length) {
    // Fallback textual si todos fallan
    const initials = name.split(/\s+/).map(w => w[0]?.toUpperCase() || "").join("").slice(0,3);
    return (
      <div title={title ?? name}
           className={`inline-flex items-center justify-center rounded-md bg-slate-700/60 text-slate-200 ${className}`}
           style={{ width: size, height: size, fontSize: size * 0.45 }}>
        {initials || "?"}
      </div>
    );
  }

  const src = `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${tries[idx]}.png`;

  return (
    <img
      src={src}
      alt={name}
      title={title ?? name}
      width={size}
      height={size}
      className={`inline-block rounded-md object-cover ${className}`}
      loading="lazy"
      onError={() => setIdx(i => i + 1)} // prueba el siguiente alias
    />
  );
}
