import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { TickFormSchema, type TickFormValues } from "../schemas/forms";
import { sanitize2Digits } from "../lib/numbers";
import { HeroIcon } from "./HeroIcon";

export type TickFormProps = {
  onSubmit: (payload: any) => void | Promise<void>;
  disabled?: boolean;
  enemies: string[];
  hero?: string;
  rank?: string;
  role?: string;
  loading?: boolean;
};

export function TickForm({
  onSubmit,
  disabled,
  enemies,
  hero,
  rank,
  role,
  loading,
}: TickFormProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [imgFile, setImgFile] = React.useState<File | null>(null);
  const [extracting, setExtracting] = React.useState(false);
  const [extractError, setExtractError] = React.useState<string | null>(null);
  const [showSample, setShowSample] = React.useState(false);
  const [useSampleFallback, setUseSampleFallback] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);

  const form = useForm<TickFormValues>({
    resolver: zodResolver(TickFormSchema),
    defaultValues: {
      minute: "10",
      myLevel: "",
      myK: "",
      myD: "",
      myA: "",
      enemies: enemies.map((h) => ({
        hero: h,
        level: "",
        k: "",
        d: "",
        a: "",
      })),
    },
    mode: "onChange",
  });

  const { fields, update, replace } = useFieldArray({
    control: form.control,
    name: "enemies",
  });

  React.useEffect(() => {
    const map = new Map(
      form.getValues("enemies").map((r) => [r.hero, r] as const)
    );
    replace(
      enemies.map(
        (h) => map.get(h) || { hero: h, level: "", k: "", d: "", a: "" }
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enemies]);

  // --- Autocompletar desde captura (auto-extract al elegir/soltar archivo)
  async function handleExtract(file?: File) {
    const f = file ?? imgFile;
    if (!f) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const fd = new FormData();
      fd.append("image", f);
      if (hero) fd.append("hero", hero);
      if (rank) fd.append("rank", rank);
      if (role) fd.append("role", role);
      enemies.forEach((e, i) => fd.append(`enemies[${i}]`, e));

      const r = await fetch(
        import.meta.env.VITE_API_URL + "/tick/extract",
        { method: "POST", body: fd }
      );
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();

      if (data.minute != null) form.setValue("minute", String(data.minute));

      if (Array.isArray(data.enemy_status)) {
        const merged = enemies.map((h: string) => {
          const match = data.enemy_status.find(
            (x: any) => (x.hero || "").toLowerCase() === h.toLowerCase()
          );
          const base = { hero: h, level: "", k: "", d: "", a: "" };
          if (!match) return base;
          return {
            hero: h,
            level: match.level != null ? String(match.level) : base.level,
            k: match.kda?.k != null ? String(match.kda.k) : base.k,
            d: match.kda?.d != null ? String(match.kda.d) : base.d,
            a: match.kda?.a != null ? String(match.kda.a) : base.a,
          };
        });
        replace(merged);
      }

      if (data.my_status?.level != null)
        form.setValue("myLevel", String(data.my_status.level));
      if (data.my_status?.kda) {
        if (data.my_status.kda.k != null)
          form.setValue("myK", String(data.my_status.kda.k));
        if (data.my_status.kda.d != null)
          form.setValue("myD", String(data.my_status.kda.d));
        if (data.my_status.kda.a != null)
          form.setValue("myA", String(data.my_status.kda.a));
      }
    } catch (err: any) {
      setExtractError(
        err?.message || "No se pudo extraer información de la imagen"
      );
    } finally {
      setExtracting(false);
    }
  }

  const sampleImageUrl = React.useMemo(
    () => (import.meta as any).env.BASE_URL + "example.png",
    []
  );
  const sampleSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='520'></svg>`;
  const sampleDataUrl = React.useMemo(
    () => "data:image/svg+xml;utf8," + encodeURIComponent(sampleSvg),
    []
  );

  const minute = form.watch("minute");
  const enemiesRows = form.watch("enemies");

  // --- Handlers Drag & Drop
  function onDropZoneDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(true);
  }
  function onDropZoneDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
  }
  async function onDropZoneDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setImgFile(f);
      setExtractError(null);
      await handleExtract(f);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit((vals) => {
        if (disabled) return;
        const enemy_status = vals.enemies
          .map((r) => {
            const out: any = { hero: r.hero };
            if (r.level !== "") out.level = Number(r.level);
            const hasKDA = r.k !== "" || r.d !== "" || r.a !== "";
            if (hasKDA)
              out.kda = {
                k: Number(r.k || 0),
                d: Number(r.d || 0),
                a: Number(r.a || 0),
              };
            return out;
          })
          .filter((e) => e.level !== undefined || e.kda !== undefined);

        onSubmit({
          minute: Number(vals.minute || 0),
          my_status: {
            level: vals.myLevel ? Number(vals.myLevel) : undefined,
            kda: {
              k: vals.myK ? Number(vals.myK) : undefined,
              d: vals.myD ? Number(vals.myD) : undefined,
              a: vals.myA ? Number(vals.myA) : undefined,
            },
            hero,
            rank,
            role,
          },
          enemy_status: enemy_status.length ? enemy_status : undefined,
        });
      })}
    >
      <fieldset disabled={!!disabled} className="contents">
        {/* --- AUTOCOMPLETAR DESDE CAPTURA --- */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-slate-200">
              Autocompletar con captura
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowSample(true)}
              className="inline-flex items-center gap-2"
              title="Ver ejemplo de captura"
            >
              Ejemplo
            </Button>
          </div>

          <div
            className={`rounded-2xl border-2 border-dashed p-4 transition-colors ${
              dragActive
                ? "border-brand-400/70 bg-white/[.04]"
                : "border-card-stroke/70 bg-white/[.02] hover:bg-white/[.04] hover:border-brand-400/60"
            }`}
            onDragOver={onDropZoneDragOver}
            onDragLeave={onDropZoneDragLeave}
            onDrop={onDropZoneDrop}
          >
            <label
              htmlFor="tick-image"
              className="group flex cursor-pointer items-center gap-3"
            >
              {/* Ícono */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                className="opacity-80"
              >
                <rect
                  x="3"
                  y="6"
                  width="18"
                  height="12"
                  rx="3"
                  stroke="currentColor"
                  fill="none"
                />
                <path
                  d="M8 14l2.8-2.8a1 1 0 011.4 0L15 14l2-2 3 3"
                  stroke="currentColor"
                  fill="none"
                />
              </svg>

              <div className="flex-1">
                <div className="text-slate-100 text-sm">
                  {imgFile ? (
                    <span className="font-medium">{imgFile.name}</span>
                  ) : (
                    <span className="font-medium">Arrastra una imagen o haz clic para subirla</span>
                  )}
                </div>
                <div className="text-xs text-slate-400">Intentaremos completar tu nivel/KDA y el de los enemigos (si es legible).</div>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="btn-outline-dark"
                >
                  {imgFile ? "Cambiar imagen" : "Elegir imagen"}
                </Button>
              </div>
            </label>

            {/* Input real oculto */}
            <input
              ref={fileInputRef}
              id="tick-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f =
                  (e.currentTarget.files && e.currentTarget.files[0]) || null;
                setImgFile(f);
                setExtractError(null);
                if (f) await handleExtract(f); // auto-extract
              }}
            />
          </div>

          {/* Estados / feedback */}
          <div className="mt-2 min-h-[20px] text-xs" aria-live="polite">
            {extracting && (
              <div className="inline-flex items-center gap-2 text-slate-300">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Analizando la imagen…
              </div>
            )}
            {!extracting && imgFile && !extractError && (
              <div className="inline-flex items-center gap-2 text-emerald-400">
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    fill="none"
                  />
                </svg>
                Listo, completé el formulario. Revísalo y corrige si hace falta.
              </div>
            )}
            {extractError && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
                No pudimos leer la captura. Asegúrate de que el marcador/KDA sea legible y vuelve a intentarlo.
                <div className="mt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => imgFile && handleExtract(imgFile)}
                  >
                    Reintentar lectura
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de ejemplo */}
        {showSample && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setShowSample(false)}
          >
            <div
              className="relative max-w-3xl w-[min(92vw,900px)] rounded-2xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="text-sm font-medium">Ejemplo de captura</div>
                <button
                  type="button"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-slate-100"
                  aria-label="Cerrar"
                  onClick={() => setShowSample(false)}
                >
                  ×
                </button>
              </div>
              <div className="p-3 sm:p-4">
                <img
                  src={useSampleFallback ? sampleDataUrl : sampleImageUrl}
                  onError={() => setUseSampleFallback(true)}
                  alt="Ejemplo de captura con minuto y K/D/A visibles"
                  className="w-full h-auto rounded-lg border border-slate-200"
                />
                <div className="mt-2 text-xs text-slate-600">
                  Asegúrate de que el nombre y el K/D/A sean legibles en tu captura.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campos compactos */}
        <div className="grid gap-2 sm:grid-cols-3 items-end">
          <div>
            <Label>
              Minuto (máx. 2 dígitos){" "}
              <span className="text-amber-500">*</span>
            </Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={minute}
              onChange={(e) =>
                form.setValue(
                  "minute",
                  sanitize2Digits(
                    (e.target as HTMLInputElement).value,
                    99,
                    0
                  ),
                  { shouldValidate: true }
                )
              }
              uiSize="sm"
              required
            />
          </div>
          <div>
            <Label>Tu nivel (opcional)</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={form.watch("myLevel")}
              onChange={(e) =>
                form.setValue(
                  "myLevel",
                  sanitize2Digits(
                    (e.target as HTMLInputElement).value,
                    30,
                    1
                  ),
                  { shouldValidate: true }
                )
              }
              uiSize="sm"
            />
          </div>
          <div>
            <Label>Tu K/D/A (opcional)</Label>
            <div className="flex gap-1.5">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={form.watch("myK")}
                onChange={(e) =>
                  form.setValue(
                    "myK",
                    sanitize2Digits(
                      (e.target as HTMLInputElement).value,
                      99,
                      0
                    ),
                    { shouldValidate: true }
                  )
                }
                placeholder="K"
                className="w-14"
                uiSize="sm"
              />
              <Input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={form.watch("myD")}
                onChange={(e) =>
                  form.setValue(
                    "myD",
                    sanitize2Digits(
                      (e.target as HTMLInputElement).value,
                      99,
                      0
                    ),
                    { shouldValidate: true }
                  )
                }
                placeholder="D"
                className="w-14"
                uiSize="sm"
              />
              <Input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={form.watch("myA")}
                onChange={(e) =>
                  form.setValue(
                    "myA",
                    sanitize2Digits(
                      (e.target as HTMLInputElement).value,
                      99,
                      0
                    ),
                    { shouldValidate: true }
                  )
                }
                placeholder="A"
                className="w-14"
                uiSize="sm"
              />
            </div>
          </div>
        </div>

        {/* Enemigos */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <Label>
              Héroes enemigos <span className="text-amber-500">*</span>
            </Label>
            <div className="text-xs text-slate-500">
              Indica como mínimo el nivel de cada enemigo (K/D/A opcional)
            </div>
          </div>
          {enemies.length === 0 ? (
            <div className="text-xs text-slate-500">
              No hay enemigos. Inicia la partida para verlos.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-card-stroke">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium" scope="col">
                      Héroe
                    </th>
                    <th className="px-2 py-1 text-left font-medium" scope="col">
                      Nivel
                    </th>
                    <th className="px-2 py-1 text-left font-medium" scope="col">
                      K
                    </th>
                    <th className="px-2 py-1 text-left font-medium" scope="col">
                      D
                    </th>
                    <th className="px-2 py-1 text-left font-medium" scope="col">
                      A
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-stroke/60 bg-white/[.02]">
                  {fields.map((row, idx) => (
                    <tr
                      key={row.id}
                      className="hover:bg-white/[.04] transition-colors"
                    >
                      <td className="px-2 py-1 text-slate-100 whitespace-nowrap text-[13px]">
                        <div className="flex items-center gap-2">
                          <HeroIcon name={row.hero} size={20} />
                          <span>{row.hero}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={enemiesRows[idx]?.level || ""}
                          onChange={(e) =>
                            update(idx, {
                              ...enemiesRows[idx],
                              level: sanitize2Digits(
                                (e.target as HTMLInputElement).value,
                                30,
                                1
                              ),
                            })
                          }
                          className="input-dark w-14 h-8 px-2 py-1 text-xs"
                          uiSize="sm"
                          required
                          aria-invalid={enemiesRows[idx]?.level === ""}
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={enemiesRows[idx]?.k || ""}
                          onChange={(e) =>
                            update(idx, {
                              ...enemiesRows[idx],
                              k: sanitize2Digits(
                                (e.target as HTMLInputElement).value,
                                99,
                                0
                              ),
                            })
                          }
                          className="w-14 h-8 px-2 py-1 text-xs"
                          uiSize="sm"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={enemiesRows[idx]?.d || ""}
                          onChange={(e) =>
                            update(idx, {
                              ...enemiesRows[idx],
                              d: sanitize2Digits(
                                (e.target as HTMLInputElement).value,
                                99,
                                0
                              ),
                            })
                          }
                          className="w-14 h-8 px-2 py-1 text-xs"
                          uiSize="sm"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <Input
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          value={enemiesRows[idx]?.a || ""}
                          onChange={(e) =>
                            update(idx, {
                              ...enemiesRows[idx],
                              a: sanitize2Digits(
                                (e.target as HTMLInputElement).value,
                                99,
                                0
                              ),
                            })
                          }
                          className="w-14 h-8 px-2 py-1 text-xs"
                          uiSize="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="sticky bottom-0 mt-4 bg-bg-950/70 backdrop-blur border-t border-card-stroke py-3 rounded-t-xl">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              disabled={
                !!disabled ||
                minute === "" ||
                enemiesRows.some((r) => r.level === "") ||
                !!loading
              }
              aria-live="polite"
            >
              {loading ? "Enviando…" : "Enviar /tick"}
            </Button>
            {(minute === "" || enemiesRows.some((r) => r.level === "")) &&
              !disabled &&
              !loading && (
                <div className="text-xs text-amber-500">
                  {minute === "" ? "El minuto es obligatorio. " : null}
                  {enemiesRows.some((r) => r.level === "") ? "Completa el nivel de todos los enemigos." : null}
                </div>
              )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                form.setValue("myLevel", "");
                form.setValue("myK", "");
                form.setValue("myD", "");
                form.setValue("myA", "");
                replace(
                  enemies.map((h) => ({
                    hero: h,
                    level: "",
                    k: "",
                    d: "",
                    a: "",
                  }))
                );
              }}
              className="text-slate-300 hover:bg-white/5"
            >
              Limpiar
            </Button>
            {loading && (
              <div
                className="inline-flex items-center gap-2 text-sm text-slate-600"
                aria-live="polite"
              >
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
                  role="status"
                  aria-label="loading"
                />
                Cargando…
              </div>
            )}
            {disabled && (
              <div className="text-xs text-slate-500">Inicia la partida con /init para habilitar /tick o pulsa "Crear nuevo tick".</div>
            )}
          </div>
        </div>
      </fieldset>
    </form>
  );
}

export default TickForm;
