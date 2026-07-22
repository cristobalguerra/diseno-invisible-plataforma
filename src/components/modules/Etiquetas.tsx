import { useMemo, useRef, useState } from "react";
import { Download, ScanLine } from "lucide-react";
import type { CategoryId } from "../../lib/types";
import { CATEGORIES, CATEGORY_COLOR } from "../../data/catalog";
import type { CategoryParams, DataSource, SensorProfile } from "../../lib/labels/types";
import { SOURCE_SHORT } from "../../lib/labels/types";
import { globalLoad, setParam } from "../../lib/labels/profiles";
import { profileSheet } from "../../lib/labels/sheet";
import { downloadPng, downloadSvg } from "../../lib/export";
import { Button, Eyebrow, Segmented, cx } from "../ui/kit";
import { EtiquetaSona } from "../labels/EtiquetaSona";

const PARAMS: { key: keyof CategoryParams; label: string }[] = [
  { key: "intensity", label: "Intensidad promedio" },
  { key: "peak", label: "Pico máximo" },
  { key: "variability", label: "Variabilidad" },
  { key: "duration", label: "Duración" },
  { key: "predictability", label: "Predictibilidad" },
  { key: "confidence", label: "Confianza del dato" },
];

/** lo que el sello (color, nivel 1) muestra de verdad */
const MAPPING: [string, string][] = [
  ["Intensidad", "medidor y palabra de nivel"],
  ["Estado", "familia de color de la etiqueta"],
  ["Índice", "promedio de las 7 lecturas"],
  ["Confianza", "se registra por categoría"],
];

const SOURCES: DataSource[] = ["sensor", "observation", "survey"];

export function Etiquetas({
  profiles,
  onProfilesChange,
  selectedId,
  onSelectId,
}: {
  profiles: SensorProfile[];
  onProfilesChange: (p: SensorProfile[]) => void;
  selectedId: string;
  onSelectId: (id: string) => void;
}) {
  const [selectedCat, setSelectedCat] = useState<CategoryId>("sound");
  const [tab, setTab] = useState<"datos" | "ficha">("datos");
  const sealRef = useRef<SVGSVGElement>(null);

  const profile = profiles.find((p) => p.id === selectedId) ?? profiles[0];
  const load = globalLoad(profile);
  const sheet = useMemo(() => profileSheet(profile), [profile]);
  const cp = profile.params[selectedCat];

  function patch(key: keyof CategoryParams, value: number | DataSource) {
    // ajustar el dato de una categoría la marca como evaluada (para el mapa multicapa)
    onProfilesChange(
      profiles.map((p) =>
        p.id === profile.id ? setParam(setParam(p, selectedCat, key, value), selectedCat, "evaluated", true) : p,
      ),
    );
  }

  const fname = `etiqueta-${profile.code}`;

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-7">
        <Eyebrow>02 · Etiqueta</Eyebrow>
        <h1 className="mt-2 text-display font-bold leading-[1.1] tracking-tight text-ink md:text-display-lg">
          Etiqueta de lectura del lugar
        </h1>
        <p className="mt-2 max-w-[68ch] text-strong leading-relaxed text-ink-2">
          La lectura de un espacio se <strong>clasifica en un estado</strong> que tiñe la etiqueta
          completa: índice, medidores de las siete categorías y descripción anticipatoria. Aquí
          capturas o corriges los datos medidos y la etiqueta se regenera al instante.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
        {/* sello + controles */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 rounded-md border border-line bg-sunken p-6">
            <div className="w-full max-w-[400px]" style={{ aspectRatio: "9 / 16" }}>
              <EtiquetaSona key={profile.id} ref={sealRef} profile={profile} animateIn />
            </div>
            <div className="flex w-full items-baseline justify-between border-t border-line pt-3">
              <div className="min-w-0">
                <div className="truncate font-mono text-eyebrow text-ink-3">{profile.code} · {profile.site}</div>
                <div className="text-strong font-semibold text-ink">{profile.name}</div>
              </div>
              <span className="shrink-0 font-mono text-eyebrow text-ink-3">carga {Math.round(load * 100)}%</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-caption text-ink-2">
              Espacio
              <select
                value={profile.id}
                onChange={(e) => onSelectId(e.target.value)}
                className="max-w-[220px] rounded-sm border border-line-strong bg-paper px-2 py-1 text-body text-ink transition-colors duration-150 ease-out focus-visible:border-accent"
              >
                {Object.entries(
                  profiles.reduce((acc, p) => {
                    (acc[p.site] ??= []).push(p);
                    return acc;
                  }, {} as Record<string, SensorProfile[]>),
                ).map(([s, list]) => (
                  <optgroup key={s} label={s}>
                    {list.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <Button icon={<Download size={14} />} onClick={() => sealRef.current && downloadSvg(sealRef.current, fname)}>SVG</Button>
              <Button icon={<Download size={14} />} onClick={() => sealRef.current && downloadPng(sealRef.current, fname)}>PNG</Button>
            </div>
          </div>
        </section>

        {/* panel derecho: datos / ficha */}
        <aside className="flex flex-col gap-4 rounded-md border border-line bg-paper p-5">
          <div className="inline-flex self-start rounded-sm border border-line-strong bg-canvas p-0.5">
            {(["datos", "ficha"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={cx(
                  "rounded-[2px] px-3 py-1 text-caption font-medium transition duration-150 ease-out active:scale-[0.96]",
                  tab === t ? "bg-ink text-canvas" : "text-ink-2 hover:text-ink",
                )}
              >
                {t === "datos" ? "Datos" : "Ficha (escaneo)"}
              </button>
            ))}
          </div>

          {tab === "datos" ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const active = c.id === selectedCat;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCat(c.id)}
                      aria-pressed={active}
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-eyebrow font-medium transition duration-150 ease-out active:scale-[0.97]",
                        active ? "border-ink bg-ink text-canvas" : "border-line-strong text-ink-2 hover:border-ink hover:text-ink",
                      )}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[c.id] }} aria-hidden />
                      {c.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3">
                {PARAMS.map((pm) => (
                  <Slider key={pm.key} label={pm.label} value={cp[pm.key] as number} onChange={(v) => patch(pm.key, v)} />
                ))}
                <label className="flex flex-col gap-1.5">
                  <span className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-ink-3">Fuente del dato</span>
                  <Segmented<DataSource>
                    size="sm"
                    value={cp.source}
                    onChange={(v) => patch("source", v)}
                    options={SOURCES.map((s) => ({ value: s, label: SOURCE_SHORT[s] }))}
                  />
                </label>
              </div>

              <div className="mt-1 rounded-sm border border-line bg-sunken p-3">
                <div className="mb-1.5 text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">Qué muestra la etiqueta</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {MAPPING.map(([k, v]) => (
                    <div key={k} className="flex items-baseline gap-1.5 text-eyebrow leading-snug">
                      <span className="text-ink">{k}</span>
                      <span className="text-ink-3">→ {v}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-eyebrow leading-snug text-ink-3">
                  El resto de parámetros (pico, variabilidad, predictibilidad, fuente) se registran y
                  alimentan la ficha de anticipación.
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-sm border border-line bg-sunken p-3">
                <ScanLine size={16} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <div className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">Al escanear · anticipación</div>
                  <p className="mt-1 text-body leading-relaxed text-ink">{sheet.anticipation}</p>
                </div>
              </div>
              <div className="flex flex-col">
                {sheet.rows.map((r) => (
                  <div key={r.id} className="flex flex-col gap-1 border-t border-line py-2.5 first:border-t-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2 text-body font-semibold text-ink">
                        <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[r.id] }} aria-hidden />
                        {r.name}
                      </span>
                      <span className="font-mono text-eyebrow text-ink-3">{r.levelWord} · {r.pct}%</span>
                    </div>
                    <p className="text-caption leading-snug text-ink-2">{r.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between text-caption">
        <span className="text-ink-2">{label}</span>
        <span className="tnum font-mono text-eyebrow text-ink-3">{Math.round(value * 100)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sunken"
        style={{ accentColor: "var(--color-accent)" }}
      />
    </label>
  );
}
