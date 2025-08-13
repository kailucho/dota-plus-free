import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { MultiCombobox } from "./multi-combobox";
import { Combobox } from "./combobox";
import { InitFormSchema, type InitFormValues } from "../schemas/forms";
import { rankOptions } from "../data/ranks";
import { heroOptions } from "../data/heroes";
import { HeroIcon } from "./HeroIcon";

export type InitFormProps = {
  disabled?: boolean;
  onSubmit: (payload: InitFormValues) => void | Promise<void>;
  onReset?: (vals: InitFormValues) => void;
  initialValues?: InitFormValues;
};

export function InitForm({ disabled, onSubmit, onReset, initialValues }: InitFormProps) {
  const DEFAULT_ENEMIES = React.useMemo(
    () => ["Void", "Jakiro", "Axe", "Clinkz", "Zeus"],
    []
  );

  const form = useForm<InitFormValues>({
    resolver: zodResolver(InitFormSchema),
    defaultValues:
      initialValues ?? {
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

  return (
    <form
      onSubmit={form.handleSubmit(async (vals) => {
        if (disabled) return;
        await onSubmit({
          ...vals,
          constraints: vals.constraints?.trim() || undefined,
        });
      })}
      className="space-y-3"
    >
      <fieldset disabled={disabled || submitting} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label>Rango</Label>
            <Select
              value={form.watch("rank")}
              onChange={(e) =>
                form.setValue("rank", (e.target as HTMLSelectElement).value, {
                  shouldValidate: true,
                })
              }
              size="sm"
            >
              {rankOptions.map((o) => (
                <option key={o.value} value={o.label}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Héroe</Label>
            <Combobox
              options={heroOptions}
              value={form.watch("hero")}
              onChange={(v) =>
                form.setValue("hero", v, { shouldValidate: true })
              }
              onConfirm={(v) =>
                form.setValue("hero", v, { shouldValidate: true })
              }
              placeholder="Buscar héroe"
              size="sm"
              renderValue={(v) => (
                <div className="pointer-events-none">
                  <HeroIcon name={v} size={18} />
                </div>
              )}
              renderOption={(opt) => (
                <div className="flex items-center gap-2">
                  <HeroIcon name={opt.label} size={18} />
                  <span>{opt.label}</span>
                </div>
              )}
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Select
              value={form.watch("role")}
              onChange={(e) =>
                form.setValue(
                  "role",
                  (e.target as HTMLSelectElement).value as any,
                  { shouldValidate: true }
                )
              }
              size="sm"
            >
              {["Mid", "Offlane", "Hard Carry", "Support", "Hard Support"].map(
                (r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                )
              )}
            </Select>
          </div>
        </div>
          <div>
            <Label>Enemigos (5 exactos)</Label>
          <MultiCombobox
            options={heroOptions}
            values={form.watch("enemies")}
            onChange={(vals) =>
              form.setValue("enemies", vals, { shouldValidate: true })
            }
            placeholder="Agregar (Enter, coma o Tab)"
            maxSelections={5}
            size="sm"
            renderTag={(v) => (
              <span className="inline-flex items-center gap-2">
                <HeroIcon name={v} size={16} />
                <span>{v}</span>
              </span>
            )}
            renderOption={(opt) => (
              <div className="flex items-center gap-2">
                <HeroIcon name={opt.label} size={18} />
                <span>{opt.label}</span>
              </div>
            )}
          />
          <div className="help mt-1 text-xs text-slate-400/80">Selecciona 5 héroes enemigos.</div>
        </div>
      </fieldset>
      <div className="flex items-center gap-3 pt-1">
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || !exactlyFive || !!disabled}
          aria-live="polite"
        >
          {submitting ? "Enviando…" : "Generar build inicial"}
        </Button>
        {!exactlyFive && !submitting && !disabled && (
          <div className="text-xs text-amber-600">Selecciona 5 enemigos para continuar.</div>
        )}
        {disabled && (
          <>
            <div className="inline-flex items-center gap-1.5 text-sm text-slate-600">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Partida en curso
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const vals = form.getValues();
                form.reset(vals);
                onReset?.(vals);
              }}
            >
              Reiniciar partida
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

export default InitForm;
