import { useRef, useState } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import type { CategoryId, Severity, Zone } from "../../lib/types";
import { CATEGORIES, getCategory, SEVERITY_COLOR } from "../../data/catalog";
import { computePriority, PRIORITY_SEVERITY } from "../../lib/priority";
import { emptyLevels } from "../../data/zones";
import { downloadPng, downloadSvg } from "../../lib/export";
import { Button, Eyebrow, Field, Segmented, cx } from "../ui/kit";
import { FichaZona } from "../signage/FichaZona";

const SEVS: Severity[] = [0, 1, 2];
const LEVELS: ("baja" | "media" | "alta")[] = ["baja", "media", "alta"];
const PRI_LABEL = { baja: "Baja", media: "Media", alta: "Alta" } as const;

export function Signage({ zones, onZonesChange }: { zones: Zone[]; onZonesChange: (z: Zone[]) => void }) {
  const [selectedId, setSelectedId] = useState(zones[0]?.id ?? "");
  const fichaRef = useRef<SVGSVGElement>(null);

  const zone = zones.find((z) => z.id === selectedId) ?? zones[0];
  const priority = zone ? computePriority(zone.levels) : null;

  function patchZone(patch: Partial<Zone>) {
    onZonesChange(zones.map((z) => (z.id === zone.id ? { ...z, ...patch } : z)));
  }
  function setLevel(cat: CategoryId, sev: Severity) {
    patchZone({ levels: { ...zone.levels, [cat]: sev } });
  }
  function addZone() {
    const n = zones.length + 1;
    const id = `z${Date.now()}`;
    const fresh: Zone = { id, code: `Z-${String(n).padStart(2, "0")}`, name: "Zona nueva", levels: emptyLevels() };
    onZonesChange([...zones, fresh]);
    setSelectedId(id);
  }
  function removeZone() {
    if (zones.length <= 1) return;
    const idx = zones.findIndex((z) => z.id === zone.id);
    const next = zones.filter((z) => z.id !== zone.id);
    onZonesChange(next);
    setSelectedId(next[Math.max(0, idx - 1)].id);
  }

  if (!zone || !priority) return null;
  const activeIdx = LEVELS.indexOf(priority.level);

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-7">
        <Eyebrow>03 · Señalética</Eyebrow>
        <h1 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-tight text-ink md:text-[30px]">
          Ficha de señalética por zona
        </h1>
        <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-ink-2">
          Define las condiciones sensoriales de cada zona del recorrido. El sistema calcula la
          prioridad de intervención: alta carga sensorial sumada a baja orientación marca una
          zona crítica.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[248px_1fr]">
        {/* lista de zonas */}
        <aside className="flex flex-col border-b border-line p-4 lg:border-b-0 lg:border-r">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Recorrido</span>
            <span className="font-mono text-[11px] text-ink-3">{zones.length}</span>
          </div>
          <div className="flex flex-col gap-1">
            {zones.map((z) => {
              const p = computePriority(z.levels);
              const active = z.id === zone.id;
              return (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setSelectedId(z.id)}
                  aria-current={active ? "true" : undefined}
                  className={cx(
                    "flex items-center gap-2.5 rounded-sm border px-2.5 py-2 text-left transition duration-150 ease-out active:scale-[0.98]",
                    active ? "border-line-strong bg-paper" : "border-transparent hover:bg-sunken",
                  )}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SEVERITY_COLOR[PRIORITY_SEVERITY[p.level]] }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{z.name}</span>
                    <span className="font-mono text-[10px] text-ink-3">{z.code}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addZone}
            className="mt-2 flex items-center gap-2 rounded-sm border border-dashed border-line-strong px-2.5 py-2 text-[13px] font-medium text-ink-2 transition duration-150 ease-out hover:border-ink hover:text-ink active:scale-[0.99]"
          >
            <Plus size={15} />
            Agregar zona
          </button>
        </aside>

        {/* editor de zona */}
        <div className="flex flex-col gap-6 p-5 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Código</span>
                <input
                  value={zone.code}
                  onChange={(e) => patchZone({ code: e.target.value })}
                  className="w-[88px] rounded-sm border border-line bg-paper px-2.5 py-1.5 font-mono text-[13px] text-ink focus-visible:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Nombre de zona</span>
                <input
                  value={zone.name}
                  onChange={(e) => patchZone({ name: e.target.value })}
                  className="w-[200px] rounded-sm border border-line bg-paper px-2.5 py-1.5 text-[15px] font-semibold text-ink focus-visible:border-accent"
                />
              </label>
            </div>
            <Button variant="ghost" icon={<Trash2 size={14} />} onClick={removeZone} disabled={zones.length <= 1} title="Eliminar zona">
              Eliminar
            </Button>
          </div>

          {/* semáforo de prioridad */}
          <section className="rounded-md border border-line bg-paper p-4">
            <div className="mb-3 flex items-center gap-1.5">
              {LEVELS.map((lv, i) => {
                const on = i <= activeIdx;
                const col = SEVERITY_COLOR[PRIORITY_SEVERITY[lv]];
                return (
                  <div key={lv} className="flex flex-1 flex-col items-center gap-1.5">
                    <span
                      className="h-2 w-full rounded-full"
                      style={{ background: on ? col : "var(--color-sunken)", outline: i === activeIdx ? `2px solid ${col}` : "none", outlineOffset: 2 }}
                    />
                    <span className={cx("text-[11px] font-medium", i === activeIdx ? "text-ink" : "text-ink-3")}>
                      {PRI_LABEL[lv]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-baseline gap-2 border-t border-line pt-3">
              <span className="h-2.5 w-2.5 shrink-0 translate-y-0.5 rounded-full" style={{ background: SEVERITY_COLOR[PRIORITY_SEVERITY[priority.level]] }} aria-hidden />
              <div>
                <p className="text-[14px] font-semibold text-ink">
                  Prioridad {priority.level} · {priority.reason}
                </p>
                <p className="mt-0.5 text-[13px] text-ink-2">{priority.intervention}</p>
              </div>
            </div>
          </section>

          {/* editor de niveles + ficha */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_minmax(280px,360px)]">
            <section className="flex flex-col gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Condiciones sensoriales</span>
              {CATEGORIES.map((cat, i) => (
                <div key={cat.id}>
                  {i === 5 && (
                    <div className="mb-3 mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-ink-3">
                      <span className="h-px flex-1 bg-line" />
                      No suman a la carga directa
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  )}
                  <Field label="">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-ink-3">{cat.code}</span>
                        <span className="text-[13px] font-medium text-ink">{cat.name}</span>
                      </span>
                      <Segmented
                        size="sm"
                        value={String(zone.levels[cat.id])}
                        onChange={(v) => setLevel(cat.id, Number(v) as Severity)}
                        options={SEVS.map((s) => ({ value: String(s), label: getCategory(cat.id).levels[s].short }))}
                      />
                    </div>
                  </Field>
                </div>
              ))}
            </section>

            <section className="flex flex-col">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Ficha de zona</span>
                <span className="text-[11px] text-ink-3">vista de impresión</span>
              </div>
              <div className="flex flex-1 items-start justify-center rounded-md border border-line bg-sunken p-4">
                <FichaZona ref={fichaRef} zone={zone} size={320} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button icon={<Download size={14} />} onClick={() => fichaRef.current && downloadSvg(fichaRef.current, `ficha-${zone.code}`)}>
                  SVG
                </Button>
                <Button icon={<Download size={14} />} onClick={() => fichaRef.current && downloadPng(fichaRef.current, `ficha-${zone.code}`)}>
                  PNG
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
