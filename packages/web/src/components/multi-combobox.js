import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
export function MultiCombobox({ options, values, onChange, placeholder, maxSelections = 5, size = "md", renderOption, renderTag, }) {
    const [input, setInput] = React.useState("");
    const [open, setOpen] = React.useState(false);
    const [cursor, setCursor] = React.useState(0);
    const rootRef = React.useRef(null);
    const inputRef = React.useRef(null);
    const remaining = maxSelections - values.length;
    const filtered = React.useMemo(() => {
        const q = input.trim().toLowerCase();
        const pool = options.filter(o => !values.includes(o.label));
        if (!q)
            return pool;
        return pool.filter(o => o.label.toLowerCase().includes(q));
    }, [options, values, input]);
    React.useEffect(() => {
        function onDocClick(e) {
            if (!rootRef.current)
                return;
            if (!rootRef.current.contains(e.target))
                setOpen(false);
        }
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);
    function commit(label) {
        if (!label)
            return;
        if (values.includes(label))
            return;
        if (values.length >= maxSelections)
            return;
        onChange([...values, label]);
        setInput("");
        setCursor(0);
        setOpen(false);
        inputRef.current?.focus();
    }
    function removeAt(idx) {
        const next = values.slice();
        next.splice(idx, 1);
        onChange(next);
        inputRef.current?.focus();
    }
    function onKeyDown(e) {
        if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
            setOpen(true);
            return;
        }
        if (e.key === "ArrowDown") {
            setCursor(c => Math.min(c + 1, Math.max(0, filtered.length - 1)));
            return;
        }
        if (e.key === "ArrowUp") {
            setCursor(c => Math.max(c - 1, 0));
            return;
        }
        if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
            e.preventDefault();
            if (!input.trim())
                return;
            const pick = filtered[cursor] || filtered[0];
            if (pick)
                commit(pick.label);
            return;
        }
        if (e.key === "Backspace" && !input) {
            if (values.length > 0)
                removeAt(values.length - 1);
            return;
        }
    }
    return (_jsxs("div", { ref: rootRef, className: "w-full", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-1.5 rounded-xl px-2 input-dark focus-within:ring-2 focus-within:ring-white/20 " +
                    (size === "sm" ? "py-1.5" : "py-2"), onClick: () => inputRef.current?.focus(), children: [values.map((v, i) => (_jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full badge-muted " +
                            (size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"), children: [renderTag ? renderTag(v) : v, _jsx("button", { type: "button", className: "rounded-full btn-outline-dark hover:bg-white/10 " +
                                    (size === "sm" ? "px-1.5 text-[10px]" : "px-2 text-xs"), onClick: () => removeAt(i), "aria-label": `Eliminar ${v}`, title: "Eliminar", children: "\u00D7" })] }, v))), remaining > 0 && (_jsx("input", { ref: inputRef, className: "flex-1 min-w-[120px] outline-none input-dark bg-transparent " + (size === "sm" ? "py-1 text-sm" : "py-1.5"), value: input, placeholder: placeholder, onFocus: () => setOpen(true), onChange: (e) => { setOpen(true); setCursor(0); setInput(e.target.value); }, onKeyDown: onKeyDown }))] }), open && filtered.length > 0 && remaining > 0 && (_jsx("div", { className: "mt-1 max-h-60 overflow-auto rounded-xl border border-card-stroke bg-bg-900/95 backdrop-blur shadow", children: filtered.map((o, i) => (_jsx("div", { className: `px-3 py-2 text-sm cursor-pointer ${i === cursor ? "bg-white/10" : "hover:bg-white/5"}`, onMouseEnter: () => setCursor(i), onMouseDown: (e) => { e.preventDefault(); commit(o.label); }, children: renderOption ? renderOption(o) : o.label }, o.value + i))) })), remaining <= 0 && (_jsxs("div", { className: "mt-1 text-xs text-slate-400", children: ["L\u00EDmite alcanzado (", maxSelections, " h\u00E9roes)."] }))] }));
}
