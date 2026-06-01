import { useEffect, useRef, useState } from "react";
import { Download, Grid3x3, ScanLine } from "lucide-react";
import type { CategoryId, ColorMode, Severity, Variant } from "../../lib/types";
import { CATEGORIES, getCategory, levelCode } from "../../data/catalog";
import { downloadPng, downloadSvg } from "../../lib/export";
import { Button, Eyebrow, Field, Segmented, Toggle, cx } from "../ui/kit";
import { Pictogram } from "../pictogram/Pictogram";
import { SignCard } from "../pictogram/SignCard";

const SEVS: Severity[] = [0, 1, 2];

export function Editor({ preset }: { preset: { category: CategoryId; sev: Severity } | null }) {
  const [category, setCategory] = useState<CategoryId>(preset?.category ?? "sound");
  const [sev, setSev] = useState<Severity>(preset?.sev ?? 2);
  const [stroke, setStroke] = useState(5);
  const [variant, setVariant] = useState<Variant>("outline");
  const [colorMode, setColorMode] = useState<ColorMode>("color");
  const [grid, setGrid] = useState(false);
  const [safe, setSafe] = useState(false);

  useEffect(() => {
    if (preset) {
      setCategory(preset.category);
      setSev(preset.sev);
    }
  }, [preset]);

  const cat = getCategory(category);
  const level = cat.levels[sev];
  const code = levelCode(category, sev);

  const pictoRef = useRef<SVGSVGElement>(null);
  const signRef = useRef<SVGSVGElement>(null);

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-7">
        <Eyebrow>02 · Editor</Eyebrow>
        <h1 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-tight text-ink md:text-[30px]">
          Parametrizar y exportar
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
        {/* controles */}
        <aside className="flex flex-col gap-5 border-b border-line p-5 md:p-6 lg:border-b-0 lg:border-r">
          <Field label="Categoría">
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  aria-pressed={c.id === category}
                  className={cx(
                    "flex items-center gap-2 rounded-sm border px-2.5 py-2 text-left text-[12px] font-medium transition duration-150 ease-out active:scale-[0.97]",
                    c.id === category
                      ? "border-ink bg-ink text-canvas"
                      : "border-line bg-paper text-ink-2 hover:border-line-strong hover:text-ink",
                  )}
                >
                  <span className={cx("font-mono text-[10px]", c.id === category ? "text-canvas/70" : "text-ink-3")}>
                    {c.code}
                  </span>
                  {c.name}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Nivel" hint={cat.loadCategory ? "Suma a la carga sensorial de la zona." : "No suma a la carga directa."}>
            <Segmented
              value={String(sev)}
              onChange={(v) => setSev(Number(v) as Severity)}
              options={SEVS.map((s) => ({ value: String(s), label: cat.levels[s].short }))}
            />
          </Field>

          <Field label={`Trazo · ${stroke}px`}>
            <input
              type="range"
              min={3}
              max={8}
              step={0.5}
              value={stroke}
              onChange={(e) => setStroke(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "var(--color-accent)" }}
            />
          </Field>

          <Field label="Relleno">
            <Segmented
              value={variant}
              onChange={setVariant}
              options={[
                { value: "outline", label: "Línea" },
                { value: "solid", label: "Sólido" },
              ]}
            />
          </Field>

          <Field label="Color" hint="En «Mono» el nivel se lee por forma y cantidad, sin color.">
            <Segmented
              value={colorMode}
              onChange={setColorMode}
              options={[
                { value: "color", label: "Semáforo" },
                { value: "mono", label: "Mono" },
              ]}
            />
          </Field>

          <div className="flex flex-col gap-2.5 border-t border-line pt-4">
            <Toggle checked={grid} onChange={setGrid} label="Retícula de construcción" />
            <Toggle checked={safe} onChange={setSafe} label="Área de seguridad" />
          </div>
        </aside>

        {/* previsualización */}
        <div className="flex flex-col gap-6 p-5 md:p-7">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* pictograma */}
            <section className="flex flex-col">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">Pictograma</span>
                <span className="font-mono text-[12px] text-ink-3">{code}</span>
              </div>
              <div className={cx("flex flex-1 items-center justify-center rounded-md border border-line bg-sunken p-8", grid && "grid-bg")}>
                <Pictogram
                  ref={pictoRef}
                  category={category}
                  sev={sev}
                  size={224}
                  stroke={stroke}
                  variant={variant}
                  colorMode={colorMode}
                  showGrid={grid}
                  showSafeArea={safe}
                  title={`${cat.name}: ${level.label}`}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <Button icon={<Download size={14} />} onClick={() => pictoRef.current && downloadSvg(pictoRef.current, code)}>
                  SVG
                </Button>
                <Button icon={<Download size={14} />} onClick={() => pictoRef.current && downloadPng(pictoRef.current, code)}>
                  PNG
                </Button>
              </div>
            </section>

            {/* señal física */}
            <section className="flex flex-col">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">Señal física</span>
                <span className="text-[11px] text-ink-3">glifo + medidor + texto</span>
              </div>
              <div className="flex flex-1 items-center justify-center rounded-md border border-line bg-sunken p-6">
                <SignCard ref={signRef} category={category} sev={sev} colorMode={colorMode} variant={variant} size={240} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button icon={<Download size={14} />} onClick={() => signRef.current && downloadSvg(signRef.current, `${code}-senal`)}>
                  SVG
                </Button>
                <Button icon={<Download size={14} />} onClick={() => signRef.current && downloadPng(signRef.current, `${code}-senal`)}>
                  PNG
                </Button>
              </div>
            </section>
          </div>

          {/* ficha técnica */}
          <section className="rounded-md border border-line bg-paper">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
              <h2 className="text-[15px] font-bold tracking-tight text-ink">{level.label}</h2>
              <span className="text-[12px] text-ink-3">
                {cat.name} · nivel {sev + 1} de 3
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
              <Meta term="Variable" value={cat.variable} />
              <Meta term="Escala" value={cat.scale} />
              <Meta term="Norma" value={cat.norm ?? "—"} icon={<ScanLine size={12} />} />
              <Meta term="Comprensión" value={level.comprehension != null ? `${level.comprehension}%` : "s/d"} />
            </dl>
            <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
              <Block label="Mensaje">{level.message}</Block>
              <Block label="Decisión que habilita">{level.decision}</Block>
            </div>
            {level.flag === "review" && (
              <p className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-[12px] text-ink-2">
                <Grid3x3 size={13} />
                Comprensión por debajo del 70 %: candidato a rediseño antes de difundir.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Meta({ term, value, icon }: { term: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-paper px-4 py-3">
      <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">
        {icon}
        {term}
      </dt>
      <dd className="mt-1 text-[13px] font-medium text-ink">{value}</dd>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</div>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{children}</p>
    </div>
  );
}
