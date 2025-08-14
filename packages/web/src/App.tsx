import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { postSuggest, postTick } from "./api";
import type { TResponseJSON, TInitPayload } from "@dba/shared";
import { ItemIcon } from "./components/ItemIcon";
import CollapsibleCard from "./components/CollapsibleCard";
import InitForm from "./components/InitForm";
import TickForm from "./components/TickForm";

export function App() {
  const [initResp, setInitResp] = useState<TResponseJSON | null>(null);
  const [tickResp, setTickResp] = useState<TResponseJSON | null>(null);
  const [started, setStarted] = useState(false);
  const [initPayload, setInitPayload] = useState<TInitPayload | null>(null);
  const [tickLocked, setTickLocked] = useState(false);
  const [tickLoading, setTickLoading] = useState(false);
  // Secciones colapsables
  const [collapsedInit, setCollapsedInit] = useState(false);
  const [collapsedInitOrder, setCollapsedInitOrder] = useState(false);
  const [collapsedLive, setCollapsedLive] = useState(false);
  const tickRespRef = useRef<HTMLDivElement | null>(null);
  const tickMinuteRef = useRef<HTMLInputElement | null>(null);
  const suggestAbortRef = useRef<AbortController | null>(null);
  const tickAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      suggestAbortRef.current?.abort("unmount");
      tickAbortRef.current?.abort("unmount");
    };
  }, []);

  return (
    <div className="w-full min-h-screen px-4 sm:px-6 lg:px-8 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="title-gold">Dota Plus Free</h1>
        <div className="text-xs text-slate-500">v1.0</div>
      </header>

      {/* Contenedor centrado para mejorar legibilidad en pantallas grandes */}
      <div className="max-w-6xl mx-auto">
        <CollapsibleCard
          title={
            <span className="text-lg text-slate-100">
              Configuración inicial
            </span>
          }
          collapsed={collapsedInit}
          onToggle={setCollapsedInit}
          className="glass-card mb-6"
        >
          <InitForm
            disabled={started}
            initialValues={initPayload ?? undefined}
            onSubmit={async (payload) => {
              // cancel previous suggest
              suggestAbortRef.current?.abort("new-suggest");
              suggestAbortRef.current = new AbortController();
              // Nueva estructura unificada: minute 0 + my_status + enemy_status (niveles/kda en 0)
              const unifiedPayload: any = {
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
              setInitPayload(payload as any); // keep original for UI
              const items = (resp.purchase_order ?? []).map((r) => r.item);
              if ((resp.purchase_order ?? []).length > 0) {
                setCollapsedInit(true);
                setCollapsedLive(true);
              }
            }}
            onReset={(vals) => {
              setStarted(false);
              setInitResp(null);
              setTickResp(null);
              setInitPayload(vals as any);
              setTickLocked(false);
              setTickLoading(false);
              setCollapsedInit(false);
              setCollapsedInitOrder(false);
              setCollapsedLive(false);
            }}
          />
        </CollapsibleCard>

        {initResp && (
          <CollapsibleCard
            title="Orden de compra recomendada"
            collapsed={collapsedInitOrder}
            onToggle={setCollapsedInitOrder}
            className="glass-card mb-6"
          >
            <PurchaseList order={initResp.purchase_order ?? []} />
          </CollapsibleCard>
        )}

        {initResp && (initResp.purchase_order ?? []).length > 0 && (
          <CollapsibleCard
            title="Actualizaciones en vivo"
            collapsed={collapsedLive}
            onToggle={setCollapsedLive}
            className="glass-card"
          >
            <TickForm
              disabled={!started || tickLocked}
              loading={tickLoading}
              enemies={initPayload?.enemies ?? []}
              hero={initPayload?.hero}
              rank={initPayload?.rank}
              role={initPayload?.role}
              minuteRef={tickMinuteRef}
              onSubmit={async (payload) => {
                setTickLocked(true);
                setTickLoading(true);
                try {
                  // cancel previous tick
                  tickAbortRef.current?.abort("new-tick");
                  tickAbortRef.current = new AbortController();
                  const resp = await postTick(payload as any, {
                    signal: tickAbortRef.current.signal,
                    timeoutMs: 20000,
                  });
                  setTickResp(resp);
                  const next = (resp.purchase_order ?? []).map((r) => r.item);
                  if (next.length) {
                    setCollapsedInitOrder(true);
                    setCollapsedLive(true);
                  }
                } finally {
                  setTickLoading(false);
                }
                setTimeout(() => {
                  tickRespRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 50);
              }}
            />
          </CollapsibleCard>
        )}

        {tickResp && (
          <div ref={tickRespRef}>
            <Card className="glass-card mt-6">
              <CardHeader>
                <CardTitle>Resultados (actualización)</CardTitle>
              </CardHeader>
              <CardContent>
                <PurchaseList order={tickResp.purchase_order ?? []} />
                {tickLocked && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTickLocked(false);
                        setCollapsedLive(false); // re-abrir
                        // Enfocar minuto para siguiente actualización
                        requestAnimationFrame(() => {
                          tickMinuteRef.current?.focus();
                          tickMinuteRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        });
                      }}
                    >
                      Crear nuevo tick
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// (InitForm y TickForm se moved to components/*.tsx)

function PurchaseList({
  order,
}: {
  order: Array<{ item: string; why: string; phase?: string | null }>;
}) {
  if (!order || order.length === 0) {
    return (
      <div className="text-sm text-slate-500">No hay recomendaciones aún.</div>
    );
  }

  // Helpers: normalize and order phases
  const normalizePhase = (p?: string | null) => {
    const s = (p || "").toLowerCase().trim();
    if (/(starting)/.test(s)) return "Starting";
    if (/(early)/.test(s)) return "Early";
    if (/(mid)/.test(s)) return "Mid";
    if (/(late)/.test(s)) return "Late";
    if (/(situational)/.test(s)) return "Situational";
    // Title case fallback
    return (p || "General").replace(/\b\w/g, (c) => c.toUpperCase());
  };
  const phaseWeight: Record<string, number> = {
    Starting: 0,
    Early: 1,
    Mid: 2,
    Late: 3,
    Situational: 4,
    General: 5,
  };

  const groups = React.useMemo(() => {
    const map = new Map<string, Array<{ item: string; why: string }>>();
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

  return (
    <div className="space-y-5">
      {groups.map(([phase, items]) => (
        <div key={phase}>
          <div className="mb-2 flex items-center gap-2">
            <Badge className="badge-muted">{phase}</Badge>
            <span className="text-xs text-slate-400/80">
              {items.length} items
            </span>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {items.map((row, i) => (
              <div
                key={row.item + i}
                className="group flex items-start gap-3 rounded-xl border border-card-stroke/60 bg-white/[.025] hover:bg-brand-300/10 hover:ring-1 hover:ring-brand-400/20 p-2 sm:p-3 transition-colors"
                title={row.why}
                role="listitem"
                aria-label={`Item ${row.item}`}
              >
                <div className="shrink-0">
                  <ItemIcon name={row.item} size={36} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">
                    {row.item}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400/90 line-clamp-3">
                    {row.why}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
