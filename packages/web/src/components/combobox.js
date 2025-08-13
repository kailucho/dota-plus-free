import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../lib/cn";
export function Combobox({ options, value, onChange, onConfirm, placeholder, className, maxHeight = 240, size = "md", renderOption, renderValue, }) {
    const [open, setOpen] = React.useState(false);
    const [cursor, setCursor] = React.useState(0);
    const ref = React.useRef(null);
    const filtered = React.useMemo(() => {
        const q = value.trim().toLowerCase();
        if (!q)
            return options;
        return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, value]);
    React.useEffect(() => {
        function onDocClick(e) {
            if (!ref.current)
                return;
            if (!ref.current.contains(e.target))
                setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);
    const hasAdornment = !!renderValue && !!value;
    return (_jsxs("div", { ref: ref, className: cn("relative", className), children: [hasAdornment && (_jsx("div", { className: "pointer-events-none absolute inset-y-0 left-2 flex items-center", children: renderValue(value) })), _jsx("input", { className: cn("w-full rounded-xl px-3 input-dark focus:outline-none focus:ring-2 focus:ring-white/20", size === "sm" ? "py-1.5 text-sm" : "py-2", hasAdornment && "pl-11"), value: value, placeholder: placeholder, onFocus: () => setOpen(true), onChange: (e) => {
                    setOpen(true);
                    setCursor(0);
                    onChange(e.target.value);
                }, onKeyDown: (e) => {
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
                    }
                    else if (e.key === "ArrowUp") {
                        setCursor((c) => Math.max(c - 1, 0));
                    }
                    else if (e.key === "Enter") {
                        const pick = filtered[cursor] ||
                            filtered[0] || { value, label: value };
                        onChange(pick.label);
                        onConfirm?.(pick.label);
                        setOpen(false);
                    }
                } }), open && (_jsx("div", { className: "absolute z-20 mt-1 w-full overflow-auto rounded-xl border border-card-stroke bg-bg-900/95 backdrop-blur shadow", style: { maxHeight }, children: filtered.length === 0 ? (_jsx("div", { className: "px-3 py-2 text-sm text-slate-400", children: "Sin resultados" })) : (filtered.map((o, i) => (_jsx("div", { className: cn("px-3 py-2 text-sm cursor-pointer hover:bg-white/5 flex items-center gap-2", i === cursor && "bg-white/10"), onMouseEnter: () => setCursor(i), onMouseDown: (e) => {
                        e.preventDefault();
                        onChange(o.label);
                        onConfirm?.(o.label);
                        setOpen(false);
                    }, children: renderOption ? renderOption(o) : o.label }, o.value + i)))) }))] }));
}
