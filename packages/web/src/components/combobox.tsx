import * as React from "react";
import { cn } from "../lib/cn";

export type Option = { label: string; value: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  onConfirm?: (v: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: number;
  size?: "sm" | "md";
  renderOption?: (opt: Option) => React.ReactNode;
  renderValue?: (value: string) => React.ReactNode; // <- usado
};

export function Combobox({
  options,
  value,
  onChange,
  onConfirm,
  placeholder,
  className,
  maxHeight = 240,
  size = "md",
  renderOption,
  renderValue,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const ref = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, value]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const hasAdornment = !!renderValue && !!value;

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Adorno izquierdo dentro del input (icono + texto custom si quieres) */}
      {hasAdornment && (
        <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
          {renderValue!(value)}
        </div>
      )}

      <input
        className={cn(
          "w-full rounded-xl px-3 input-dark focus:outline-none focus:ring-2 focus:ring-white/20",
          size === "sm" ? "py-1.5 text-sm" : "py-2",
          hasAdornment && "pl-11"
        )}
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setOpen(true);
          setCursor(0);
          onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          // Evitar que Enter envíe el formulario padre
          if (e.key === "Enter") {
            e.preventDefault();
          }
          if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            // Abrir el menú en la primera pulsación
            setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") {
            setCursor((c) => Math.min(c + 1, Math.max(0, filtered.length - 1)));
          } else if (e.key === "ArrowUp") {
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === "Enter") {
            const pick = filtered[cursor] ||
              filtered[0] || { value, label: value };
            onChange(pick.label);
            onConfirm?.(pick.label);
            setOpen(false);
          }
        }}
      />

      {open && (
        <div
          className="absolute z-20 mt-1 w-full overflow-auto rounded-xl border border-card-stroke bg-bg-900/95 backdrop-blur shadow"
          style={{ maxHeight }}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">
              Sin resultados
            </div>
          ) : (
            filtered.map((o, i) => (
              <div
                key={o.value + i}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer hover:bg-white/5 flex items-center gap-2",
                  i === cursor && "bg-white/10"
                )}
                onMouseEnter={() => setCursor(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o.label);
                  onConfirm?.(o.label);
                  setOpen(false);
                }}
              >
                {renderOption ? renderOption(o) : o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
