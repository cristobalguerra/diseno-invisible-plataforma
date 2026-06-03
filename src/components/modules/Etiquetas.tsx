import { useMemo, useRef, useState } from "react";
import { Download, ScanLine, Shuffle } from "lucide-react";
import type { CategoryId } from "../../lib/types";
import { CATEGORIES, getCategory, CATEGORY_COLOR } from "../../data/catalog";
import type { CategoryParams, DataSource, SensorProfile } from "../../lib/labels/types";
import { SOURCE_SHORT } from "../../lib/labels/types";
import { PROFILES, globalLoad, randomProfile, setParam } from "../../lib/labels/profiles";
import { profileSheet } from "../../lib/labels/sheet";
import { downloadPng, downloadSvg } from "../../lib/export";
import { Button, Eyebrow, Segmented, Toggle, cx } from "../ui/kit";
import { SealLegend, SensorSeal, type Complexity } from "../labels/SensorSeal";

const COMPLEXITY_NOTE: Record<Complexity, string> = {
  1: "Señal mínima: solo intensidad (longitud) y duración (grosor) por categoría.",
  2: "Media: añade pico y fragmentación leve, manteniendo el orden.",
  3: "Completa: variabilidad, predictibilidad, fuente y densidad global.",
};

const PARAMS: { key: keyof CategoryParams; label: string }[] = [
  { key: "intensity", label: "Intensidad promedio" },
  { key: "peak", label: "Pico máximo" },
  { key: "variability", label: "Variabilidad" },
  { key: "duration", label: "Duración" },
  { key: "predictability", label: "Predictibilidad" },
  { key: "confidence", label: "Confianza del dato" },
];

const MAPPING: [string, string][] = [
  ["Intensidad", "expansión radial"],
  ["Duración", "grosor del trazo"],
  ["Variabilidad", "fragmentación"],
  ["Predictibilidad", "orden / alteración"],
  ["Pico máximo", "acento exterior"],
  ["Categoría", "posición fija"],
  ["Carga global", "densidad de anillos"],
  ["Fuente / confianza", "marcador interior"],
];

const SOURCES: DataSource[] = ["sensor", "observation", "survey"];

export function Etiquetas() {
  const [profiles, setProfiles] = useState<SensorProfile[]>(PROFILES);
  const [selectedId, setSelectedId] = useState(PROFILES[0].id);
  const [selectedCat, setSelectedCat] = useState<CategoryId>("sound");
  const [color, setColor] = useState(false);
  const [complexity, setComplexity] = useState<Complexity>(1);
  const [tab, setTab] = useState<"datos" | "ficha">("datos");
  const [rndN, setRndN] = useState(1);
  const sealRef = useRef<SVGSVGElement>(null);

  const profile = profiles.find((p) => p.id === selectedId) ?? profiles[0];
  const colorMode = color ? "color" : "mono";
  const load = globalLoad(profile);
  const sheet = useMemo(() => profileSheet(profile), [profile]);
  const cp = profile.params[selectedCat];

  function patch(key: keyof CategoryParams, value: number | DataSource) {
    setProfiles((list) => list.map((p) => (p.id === profile.id ? setParam(p, selectedCat, key, value) : p)));
  }
  function addRandom() {
    const p = randomProfile(rndN);
    setProfiles((list) => [...list, p]);
    setSelectedId(p.id);
    setRndN((n) => n + 1);
  }

  const fname = `sello-${profile.code}`;

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-7">
        <Eyebrow>06 · Etiquetas sensoriales</Eyebrow>
        <h1 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-tight text-ink md:text-[30px]">
          Sello sensorial generativo
        </h1>
        <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-ink-2">
          Un marcador circular-radial, generado por datos del espacio, que codifica el perfil
          sensorial completo. No es un pictograma: es un <strong>sello reconocible</strong> de la
          familia. Cada categoría ocupa una <strong>posición fija</strong> y sus parámetros se
          traducen a atributos gráficos. Al escanear, abre la ficha de anticipación.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
        {/* sello + controles */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 rounded-md border border-line bg-sunken p-6">
            <div className="w-full max-w-[360px]" style={{ aspectRatio: "1 / 1" }}>
              <SensorSeal ref={sealRef} profile={profile} colorMode={colorMode} complexity={complexity} />
            </div>
            <div className="flex w-full items-baseline justify-between border-t border-line pt-3">
              <div>
                <span className="font-mono text-[11px] text-ink-3">{profile.code}</span>
                <span className="ml-2 text-[14px] font-semibold text-ink">{profile.name}</span>
              </div>
              <span className="font-mono text-[11px] text-ink-3">carga {Math.round(load * 100)}%</span>
            </div>
          </div>

          {/* leyenda de posiciones */}
          <div className="flex items-center gap-4 rounded-md border border-line bg-paper p-4">
            <div className="h-[120px] w-[120px] shrink-0">
              <SealLegend />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-ink">Posiciones fijas</div>
              <p className="mt-1 text-[12px] leading-snug text-ink-2">
                Cada categoría ocupa siempre el mismo sector del anillo. Esa constancia es lo que
                vuelve el sistema aprendible: con el tiempo se reconoce un perfil de un vistazo.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-line bg-paper p-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Complejidad visual</span>
              <div className="inline-flex rounded-sm border border-line-strong bg-canvas p-0.5">
                {([1, 2, 3] as Complexity[]).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setComplexity(n)}
                    aria-pressed={complexity === n}
                    className={cx(
                      "w-8 rounded-[2px] py-1 text-[12px] font-semibold transition duration-150 ease-out active:scale-[0.94]",
                      complexity === n ? "bg-ink text-canvas" : "text-ink-2 hover:text-ink",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[12px] leading-snug text-ink-2">{COMPLEXITY_NOTE[complexity]}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button icon={<Shuffle size={14} />} onClick={addRandom}>Generar aleatorio</Button>
              <Toggle checked={color} onChange={setColor} label="Color" />
            </div>
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
                  "rounded-[2px] px-3 py-1 text-[12px] font-medium transition duration-150 ease-out active:scale-[0.96]",
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
                        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] font-medium transition duration-150 ease-out active:scale-[0.97]",
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
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Fuente del dato</span>
                  <Segmented<DataSource>
                    size="sm"
                    value={cp.source}
                    onChange={(v) => patch("source", v)}
                    options={SOURCES.map((s) => ({ value: s, label: SOURCE_SHORT[s] }))}
                  />
                </label>
              </div>

              <div className="mt-1 rounded-sm border border-line bg-sunken p-3">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Cómo se codifica</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {MAPPING.map(([k, v]) => (
                    <div key={k} className="flex items-baseline gap-1.5 text-[11px] leading-snug">
                      <span className="text-ink">{k}</span>
                      <span className="text-ink-3">→ {v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 rounded-sm border border-line bg-sunken p-3">
                <ScanLine size={16} className="mt-0.5 shrink-0 text-accent" />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Al escanear · anticipación</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink">{sheet.anticipation}</p>
                </div>
              </div>
              <div className="flex flex-col">
                {sheet.rows.map((r) => (
                  <div key={r.id} className="flex flex-col gap-1 border-t border-line py-2.5 first:border-t-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                        <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[r.id] }} aria-hidden />
                        {r.name}
                      </span>
                      <span className="font-mono text-[11px] text-ink-3">{r.levelWord} · {r.pct}%</span>
                    </div>
                    <p className="text-[12px] leading-snug text-ink-2">{r.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* familia / variedad */}
      <section className="border-t border-line px-5 py-6 md:px-8">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Familia · perfiles distintos, una misma estructura</span>
          <span className="font-mono text-[11px] text-ink-3">{profiles.length} sellos</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {profiles.map((p) => {
            const active = p.id === selectedId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                title={`${p.code} · ${p.name}`}
                className={cx(
                  "flex flex-col items-center gap-1.5 rounded-md border p-3 transition duration-150 ease-out active:scale-[0.97]",
                  active ? "border-ink bg-sunken" : "border-line bg-paper hover:border-line-strong",
                )}
              >
                <div className="h-[96px] w-[96px]">
                  <SensorSeal profile={p} colorMode={colorMode} complexity={complexity} />
                </div>
                <span className="font-mono text-[10px] text-ink-3">{p.code}</span>
                <span className="max-w-[96px] truncate text-[11px] font-medium text-ink">{p.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-baseline justify-between text-[12px]">
        <span className="text-ink-2">{label}</span>
        <span className="tnum font-mono text-[11px] text-ink-3">{Math.round(value * 100)}</span>
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
