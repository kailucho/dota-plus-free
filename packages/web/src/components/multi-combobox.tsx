import * as React from "react";
export type Option = { label: string; value: string };

type Props = {
  options: Option[];
  values: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  size?: "sm" | "md";
  renderOption?: (opt: Option) => React.ReactNode; // <- nuevo
  renderTag?: (value: string) => React.ReactNode;   // <- nuevo
};

export function MultiCombobox({
  options, values, onChange, placeholder,
  maxSelections = 5, size = "md", renderOption, renderTag,
}: Props) {
  const [input, setInput] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [cursor, setCursor] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const remaining = maxSelections - values.length;

  const filtered = React.useMemo(() => {
    const q = input.trim().toLowerCase();
    const pool = options.filter(o => !values.includes(o.label));
    if (!q) return pool;
    return pool.filter(o => o.label.toLowerCase().includes(q));
  }, [options, values, input]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function commit(label: string) {
    if (!label) return;
    if (values.includes(label)) return;
    if (values.length >= maxSelections) return;
    onChange([...values, label]);
    setInput("");
    setCursor(0);
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeAt(idx: number) {
    const next = values.slice();
    next.splice(idx, 1);
    onChange(next);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") { setCursor(c => Math.min(c + 1, Math.max(0, filtered.length - 1))); return; }
    if (e.key === "ArrowUp")   { setCursor(c => Math.max(c - 1, 0)); return; }
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      if (!input.trim()) return;
      const pick = filtered[cursor] || filtered[0];
      if (pick) commit(pick.label);
      return;
    }
    if (e.key === "Backspace" && !input) {
      if (values.length > 0) removeAt(values.length - 1);
      return;
    }
  }

  return (
    <div ref={rootRef} className="w-full">
      {/* Chips + input */}
      <div
        className={
          "flex flex-wrap items-center gap-1.5 rounded-xl px-2 input-dark focus-within:ring-2 focus-within:ring-white/20 " +
          (size === "sm" ? "py-1.5" : "py-2")
        }
        onClick={() => inputRef.current?.focus()}
      >
        {values.map((v, i) => (
          <span
            key={v}
            className={
              "inline-flex items-center gap-1.5 rounded-full badge-muted " +
              (size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm")
            }
          >
            {renderTag ? renderTag(v) : v}
            <button
              type="button"
              className={
                "rounded-full btn-outline-dark hover:bg-white/10 " +
                (size === "sm" ? "px-1.5 text-[10px]" : "px-2 text-xs")
              }
              onClick={() => removeAt(i)}
              aria-label={`Eliminar ${v}`}
              title="Eliminar"
            >
              ×
            </button>
          </span>
        ))}
        {remaining > 0 && (
          <input
            ref={inputRef}
            className={"flex-1 min-w-[120px] outline-none input-dark bg-transparent " + (size === "sm" ? "py-1 text-sm" : "py-1.5")}
            value={input}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setOpen(true); setCursor(0); setInput(e.target.value); }}
            onKeyDown={onKeyDown}
          />
        )}
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && remaining > 0 && (
        <div className="mt-1 max-h-60 overflow-auto rounded-xl border border-card-stroke bg-bg-900/95 backdrop-blur shadow">
          {filtered.map((o, i) => (
            <div
              key={o.value + i}
              className={`px-3 py-2 text-sm cursor-pointer ${i === cursor ? "bg-white/10" : "hover:bg-white/5"}`}
              onMouseEnter={() => setCursor(i)}
              onMouseDown={(e) => { e.preventDefault(); commit(o.label); }}
            >
              {renderOption ? renderOption(o) : o.label}
            </div>
          ))}
        </div>
      )}
      {remaining <= 0 && (
        <div className="mt-1 text-xs text-slate-400">
          Límite alcanzado ({maxSelections} héroes).
        </div>
      )}
    </div>
  );
}
