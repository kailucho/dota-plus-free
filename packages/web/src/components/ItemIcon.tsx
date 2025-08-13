// web/src/components/ItemIcon.tsx
import * as React from "react";
import { dotaItemImgUrl } from "../lib/itemImages";

export function ItemIcon({ name, size = 32 }: { name: string; size?: number }) {
  const [src, setSrc] = React.useState(dotaItemImgUrl(name));
  const [triedLegacy, setTriedLegacy] = React.useState(false);
  const [err, setErr] = React.useState(false);

  const legacyUrl = src.replace("cdn.cloudflare.steamstatic.com", "cdn.steamstatic.com");

  if (err) {
    const initials = (name || "?").split(" ").map(w => w[0]?.toUpperCase()).slice(0,2).join("");
    return (
      <span title={name} className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-xs" style={{ width: size, height: size }}>
        {initials || "?"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ objectFit: "cover", borderRadius: 6, border: "1px solid #e5e7eb" }}
      onError={() => {
        if (!triedLegacy) { setSrc(legacyUrl); setTriedLegacy(true); }
        else { setErr(true); }
      }}
      loading="lazy"
    />
  );
}
