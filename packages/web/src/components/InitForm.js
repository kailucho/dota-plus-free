import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { MultiCombobox } from "./multi-combobox";
import { Combobox } from "./combobox";
import { InitFormSchema } from "../schemas/forms";
import { rankOptions } from "../data/ranks";
import { heroOptions } from "../data/heroes";
import { HeroIcon } from "./HeroIcon";
export function InitForm({ disabled, onSubmit, onReset, initialValues }) {
    const DEFAULT_ENEMIES = React.useMemo(() => ["Void", "Jakiro", "Axe", "Clinkz", "Zeus"], []);
    const form = useForm({
        resolver: zodResolver(InitFormSchema),
        defaultValues: initialValues ?? {
            rank: "Legend",
            hero: "Abaddon",
            role: "Hard Support",
            enemies: DEFAULT_ENEMIES,
            patch: "7.39d",
            constraints: "",
        },
        mode: "onChange",
    });
    const submitting = form.formState.isSubmitting;
    const exactlyFive = form.watch("enemies").length === 5;
    return (_jsxs("form", { onSubmit: form.handleSubmit(async (vals) => {
            if (disabled)
                return;
            await onSubmit({
                ...vals,
                constraints: vals.constraints?.trim() || undefined,
            });
        }), className: "space-y-3", children: [_jsxs("fieldset", { disabled: disabled || submitting, className: "space-y-3", children: [_jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [_jsxs("div", { children: [_jsx(Label, { children: "Rango" }), _jsx(Select, { value: form.watch("rank"), onChange: (e) => form.setValue("rank", e.target.value, {
                                            shouldValidate: true,
                                        }), size: "sm", children: rankOptions.map((o) => (_jsx("option", { value: o.label, children: o.label }, o.value))) })] }), _jsxs("div", { children: [_jsx(Label, { children: "H\u00E9roe" }), _jsx(Combobox, { options: heroOptions, value: form.watch("hero"), onChange: (v) => form.setValue("hero", v, { shouldValidate: true }), onConfirm: (v) => form.setValue("hero", v, { shouldValidate: true }), placeholder: "Buscar h\u00E9roe", size: "sm", renderValue: (v) => (_jsx("div", { className: "pointer-events-none", children: _jsx(HeroIcon, { name: v, size: 18 }) })), renderOption: (opt) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(HeroIcon, { name: opt.label, size: 18 }), _jsx("span", { children: opt.label })] })) })] }), _jsxs("div", { children: [_jsx(Label, { children: "Rol" }), _jsx(Select, { value: form.watch("role"), onChange: (e) => form.setValue("role", e.target.value, { shouldValidate: true }), size: "sm", children: ["Mid", "Offlane", "Hard Carry", "Support", "Hard Support"].map((r) => (_jsx("option", { value: r, children: r }, r))) })] })] }), _jsxs("div", { children: [_jsx(Label, { children: "Enemigos (5 exactos)" }), _jsx(MultiCombobox, { options: heroOptions, values: form.watch("enemies"), onChange: (vals) => form.setValue("enemies", vals, { shouldValidate: true }), placeholder: "Agregar (Enter, coma o Tab)", maxSelections: 5, size: "sm", renderTag: (v) => (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx(HeroIcon, { name: v, size: 16 }), _jsx("span", { children: v })] })), renderOption: (opt) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(HeroIcon, { name: opt.label, size: 18 }), _jsx("span", { children: opt.label })] })) }), _jsx("div", { className: "help mt-1 text-xs text-slate-400/80", children: "Selecciona 5 h\u00E9roes enemigos." })] })] }), _jsxs("div", { className: "flex items-center gap-3 pt-1", children: [_jsx(Button, { type: "submit", variant: "primary", disabled: submitting || !exactlyFive || !!disabled, "aria-live": "polite", children: submitting ? "Enviando…" : "Generar build inicial" }), !exactlyFive && !submitting && !disabled && (_jsx("div", { className: "text-xs text-amber-600", children: "Selecciona 5 enemigos para continuar." })), disabled && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "inline-flex items-center gap-1.5 text-sm text-slate-600", children: [_jsx("span", { className: "inline-block h-2 w-2 rounded-full bg-emerald-500" }), "Partida en curso"] }), _jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                    const vals = form.getValues();
                                    form.reset(vals);
                                    onReset?.(vals);
                                }, children: "Reiniciar partida" })] }))] })] }));
}
export default InitForm;
