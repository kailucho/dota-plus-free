import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { postSuggest, postTick } from "./api";
import { ItemIcon } from "./components/ItemIcon";
import CollapsibleCard from "./components/CollapsibleCard";
import InitForm from "./components/InitForm";
import TickForm from "./components/TickForm";
export function App() {
    const [initResp, setInitResp] = useState(null);
    const [tickResp, setTickResp] = useState(null);
    const [started, setStarted] = useState(false);
    const [initPayload, setInitPayload] = useState(null);
    const [tickLocked, setTickLocked] = useState(false);
    const [tickLoading, setTickLoading] = useState(false);
    // Secciones colapsables
    const [collapsedInit, setCollapsedInit] = useState(false);
    const [collapsedInitOrder, setCollapsedInitOrder] = useState(false);
    const [collapsedLive, setCollapsedLive] = useState(false);
    const tickRespRef = useRef(null);
    const suggestAbortRef = useRef(null);
    const tickAbortRef = useRef(null);
    useEffect(() => {
        return () => {
            suggestAbortRef.current?.abort("unmount");
            tickAbortRef.current?.abort("unmount");
        };
    }, []);
    return (_jsxs("div", { className: "w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6", children: [_jsxs("header", { className: "mb-6 flex items-center justify-between", children: [_jsx("h1", { className: "title-gold", children: "Dota Plus Free" }), _jsx("div", { className: "text-xs text-slate-500", children: "v1.0" })] }), _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsx(CollapsibleCard, { title: _jsx("span", { className: "text-lg text-slate-100", children: "Configuraci\u00F3n inicial" }), collapsed: collapsedInit, onToggle: setCollapsedInit, className: "glass-card mb-6", children: _jsx(InitForm, { disabled: started, initialValues: initPayload ?? undefined, onSubmit: async (payload) => {
                                // cancel previous suggest
                                suggestAbortRef.current?.abort("new-suggest");
                                suggestAbortRef.current = new AbortController();
                                // Nueva estructura unificada: minute 0 + my_status + enemy_status (niveles/kda en 0)
                                const unifiedPayload = {
                                    minute: 0,
                                    my_status: {
                                        hero: payload.hero,
                                        role: payload.role,
                                        rank: payload.rank,
                                        level: 0,
                                        kda: { kills: 0, deaths: 0, assists: 0 },
                                    },
                                    enemy_status: payload.enemies.map((h) => ({
                                        hero: h,
                                        level: 0,
                                        kda: { kills: 0, deaths: 0, assists: 0 },
                                    })),
                                };
                                const resp = await postSuggest(unifiedPayload, {
                                    signal: suggestAbortRef.current.signal,
                                    timeoutMs: 20000,
                                });
                                setInitResp(resp);
                                setStarted(true);
                                setInitPayload(payload); // keep original for UI
                                const items = (resp.purchase_order ?? []).map((r) => r.item);
                                if ((resp.purchase_order ?? []).length > 0) {
                                    setCollapsedInit(true);
                                    setCollapsedLive(true);
                                }
                            }, onReset: (vals) => {
                                setStarted(false);
                                setInitResp(null);
                                setTickResp(null);
                                setInitPayload(vals);
                                setTickLocked(false);
                                setTickLoading(false);
                                setCollapsedInit(false);
                                setCollapsedInitOrder(false);
                                setCollapsedLive(false);
                            } }) }), initResp && (_jsx(CollapsibleCard, { title: "Orden de compra recomendada", collapsed: collapsedInitOrder, onToggle: setCollapsedInitOrder, className: "glass-card mb-6", children: _jsx(PurchaseList, { order: initResp.purchase_order ?? [] }) })), initResp && (initResp.purchase_order ?? []).length > 0 && (_jsx(CollapsibleCard, { title: "Actualizaciones en vivo", collapsed: collapsedLive, onToggle: setCollapsedLive, className: "glass-card", children: _jsx(TickForm, { disabled: !started || tickLocked, loading: tickLoading, enemies: initPayload?.enemies ?? [], hero: initPayload?.hero, rank: initPayload?.rank, role: initPayload?.role, onSubmit: async (payload) => {
                                setTickLocked(true);
                                setTickLoading(true);
                                try {
                                    // cancel previous tick
                                    tickAbortRef.current?.abort("new-tick");
                                    tickAbortRef.current = new AbortController();
                                    const resp = await postTick(payload, {
                                        signal: tickAbortRef.current.signal,
                                        timeoutMs: 20000,
                                    });
                                    setTickResp(resp);
                                    const next = (resp.purchase_order ?? []).map((r) => r.item);
                                    if (next.length) {
                                        setCollapsedInitOrder(true);
                                        setCollapsedLive(true);
                                    }
                                }
                                finally {
                                    setTickLoading(false);
                                }
                                setTimeout(() => {
                                    tickRespRef.current?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start",
                                    });
                                }, 50);
                            } }) })), tickResp && (_jsx("div", { ref: tickRespRef, children: _jsxs(Card, { className: "glass-card mt-6", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Resultados (actualizaci\u00F3n)" }) }), _jsxs(CardContent, { children: [_jsx(PurchaseList, { order: tickResp.purchase_order ?? [] }), tickLocked && (_jsx("div", { className: "mt-4", children: _jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                    setTickLocked(false);
                                                    // Al crear nuevo tick, re-abrimos la sección de live update
                                                    setCollapsedLive(false);
                                                }, children: "Crear nuevo tick" }) }))] })] }) }))] })] }));
}
// (InitForm y TickForm se moved to components/*.tsx)
function PurchaseList({ order, }) {
    if (!order || order.length === 0) {
        return (_jsx("div", { className: "text-sm text-slate-500", children: "No hay recomendaciones a\u00FAn." }));
    }
    // Helpers: normalize and order phases
    const normalizePhase = (p) => {
        const s = (p || "").toLowerCase().trim();
        if (/(starting)/.test(s))
            return "Starting";
        if (/(early)/.test(s))
            return "Early";
        if (/(mid)/.test(s))
            return "Mid";
        if (/(late)/.test(s))
            return "Late";
        if (/(situational)/.test(s))
            return "Situational";
        // Title case fallback
        return (p || "General").replace(/\b\w/g, (c) => c.toUpperCase());
    };
    const phaseWeight = {
        Starting: 0,
        Early: 1,
        Mid: 2,
        Late: 3,
        Situational: 4,
        General: 5,
    };
    const groups = React.useMemo(() => {
        const map = new Map();
        for (const r of order) {
            const phase = normalizePhase(r.phase);
            const list = map.get(phase) || [];
            list.push({ item: r.item, why: r.why });
            map.set(phase, list);
        }
        return Array.from(map.entries()).sort((a, b) => {
            const wa = phaseWeight[a[0]] ?? 10;
            const wb = phaseWeight[b[0]] ?? 10;
            return wa - wb || a[0].localeCompare(b[0]);
        });
    }, [order]);
    return (_jsx("div", { className: "space-y-5", children: groups.map(([phase, items]) => (_jsxs("div", { children: [_jsxs("div", { className: "mb-2 flex items-center gap-2", children: [_jsx(Badge, { className: "badge-muted", children: phase }), _jsxs("span", { className: "text-xs text-slate-400/80", children: [items.length, " items"] })] }), _jsx("div", { className: "grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3", children: items.map((row, i) => (_jsxs("div", { className: "group flex items-start gap-3 rounded-xl border border-card-stroke/60 bg-white/[.025] hover:bg-brand-300/10 hover:ring-1 hover:ring-brand-400/20 p-2 sm:p-3 transition-colors", title: row.why, role: "listitem", "aria-label": `Item ${row.item}`, children: [_jsx("div", { className: "shrink-0", children: _jsx(ItemIcon, { name: row.item, size: 36 }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-semibold text-slate-100 truncate", children: row.item }), _jsx("div", { className: "mt-0.5 text-xs text-slate-400/90 line-clamp-3", children: row.why })] })] }, row.item + i))) })] }, phase))) }));
}
