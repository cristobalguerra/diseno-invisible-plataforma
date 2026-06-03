import { useMemo, useRef, useState } from "react";
import { Download, Grid3x3 } from "lucide-react";
import type { CategoryId } from "../../lib/types";
import type { ExportVersion, GenLevel } from "../../lib/generative/types";
import { CATEGORIES, getCategory, CATEGORY_COLOR } from "../../data/catalog";
import { generate } from "../../lib/generative/engine";
import { pictogramMeta } from "../../lib/generative/meta";
import { GEN_LEVELS, GEN_LEVEL_IDS, bandText } from "../../lib/generative/levels";
import { downloadPng, downloadSvg } from "../../lib/export";
import { Button, Eyebrow, Toggle, cx } from "../ui/kit";
import { VHighContrast, VLabeled, VPictogram, VSheet } from "../generative/GenPictogram";

const VERSIONS: { id: ExportVersion; label: string }[] = [
  { id: "pictogram", label: "Pictograma" },
  { id: "labeled", label: "Etiqueta" },
  { id: "contrast", label: "Alto contraste" },
  { id: "sheet", label: "Ficha técnica" },
];

const VIEWBOX: Record<ExportVersion, { ratio: string; max: number }> = {
  pictogram: { ratio: "1 / 1", max: 340 },
  labeled: { ratio: "96 / 126", max: 280 },
  contrast: { ratio: "1 / 1", max: 340 },
  sheet: { ratio: "248 / 306", max: 320 },
};

export function Generativo() {
  const [category, setCategory] = useState<CategoryId>("sound");
  const [level, setLevel] = useState<GenLevel>(2);
  const [version, setVersion] = useState<ExportVersion>("pictogram");
  const [color, setColor] = useState(false);
  const [grid, setGrid] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const result = useMemo(() => generate(category, level), [category, level]);
  const meta = useMemo(() => pictogramMeta(category, level), [category, level]);
  const colorMode = color ? "color" : "mono";

  // las 35 piezas (7×5) se calculan una sola vez: el sistema es determinista
  const all = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        cat: c,
        cells: GEN_LEVEL_IDS.map((l) => ({ level: l, result: generate(c.id, l), meta: pictogramMeta(c.id, l) })),
      })),
    [],
  );

  const versionProps = { result, meta, colorMode: colorMode as "color" | "mono", showGrid: grid };
  const preview =
    version === "pictogram" ? (
      <VPictogram ref={svgRef} {...versionProps} />
    ) : version === "labeled" ? (
      <VLabeled ref={svgRef} {...versionProps} />
    ) : version === "contrast" ? (
      <VHighContrast ref={svgRef} {...versionProps} />
    ) : (
      <VSheet ref={svgRef} {...versionProps} />
    );

  const fname = `${getCategory(category).code}-${level + 1}-${version}`;

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-7">
        <Eyebrow>06 · Sistema generativo</Eyebrow>
        <h1 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-tight text-ink md:text-[30px]">
          Gramática reticular 9×9
        </h1>
        <p className="mt-2 max-w-[68ch] text-[14px] leading-relaxed text-ink-2">
          Cada pictograma <em>emerge</em> de operaciones sobre una retícula de 9×9 módulos: la
          retícula es el motor formal, no una guía. La <strong>operación</strong> da la identidad de
          la categoría y la <strong>ocupación</strong> (módulos activos) codifica la intensidad en 5
          niveles, legible sin color por forma, cantidad y densidad.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
        {/* generador + preview */}
        <section className="flex flex-col gap-5">
          {/* categoría */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Categoría · comportamiento reticular</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => {
                const active = c.id === category;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={active}
                    className={cx(
                      "flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[12px] font-medium transition duration-150 ease-out active:scale-[0.97]",
                      active ? "border-ink bg-ink text-canvas" : "border-line-strong bg-paper text-ink-2 hover:border-ink hover:text-ink",
                    )}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[c.id] }} aria-hidden />
                    <span className={cx("font-mono text-[10px]", active ? "text-canvas/70" : "text-ink-3")}>{c.code}</span>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* nivel */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              Intensidad · ocupación de la retícula
            </span>
            <div className="flex gap-1.5">
              {GEN_LEVELS.map((lv) => {
                const active = lv.idx === level;
                return (
                  <button
                    key={lv.idx}
                    type="button"
                    onClick={() => setLevel(lv.idx)}
                    aria-pressed={active}
                    className={cx(
                      "flex flex-1 flex-col items-center gap-1 rounded-sm border px-1 py-2 transition duration-150 ease-out active:scale-[0.97]",
                      active ? "border-ink bg-sunken" : "border-line hover:border-line-strong",
                    )}
                  >
                    <span className={cx("text-[12px] font-semibold", active ? "text-ink" : "text-ink-2")}>{lv.short}</span>
                    <span className="font-mono text-[10px] text-ink-3">{bandText(lv.idx)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* preview */}
          <div className="flex flex-col items-center gap-4 rounded-md border border-line bg-sunken p-6">
            <div
              className="flex w-full items-center justify-center"
              style={{ aspectRatio: VIEWBOX[version].ratio, maxWidth: VIEWBOX[version].max }}
            >
              {preview}
            </div>
          </div>

          {/* versión + opciones + export */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-sm border border-line-strong bg-paper p-0.5">
              {VERSIONS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVersion(v.id)}
                  aria-pressed={version === v.id}
                  className={cx(
                    "rounded-[2px] px-2.5 py-1 text-[12px] font-medium transition duration-150 ease-out active:scale-[0.96]",
                    version === v.id ? "bg-ink text-canvas" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Toggle checked={color} onChange={setColor} label="Color" />
              <Toggle checked={grid} onChange={setGrid} label="Retícula" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button icon={<Download size={14} />} onClick={() => svgRef.current && downloadSvg(svgRef.current, fname)}>
              SVG
            </Button>
            <Button icon={<Download size={14} />} onClick={() => svgRef.current && downloadPng(svgRef.current, fname)}>
              PNG
            </Button>
            <span className="ml-auto self-center font-mono text-[11px] text-ink-3">{meta.code}</span>
          </div>
        </section>

        {/* ficha (3 capas + riesgo + validación) */}
        <aside className="flex flex-col gap-4 rounded-md border border-line bg-paper p-5">
          <div className="flex items-baseline justify-between border-b border-line pb-3">
            <div>
              <div className="font-mono text-[11px] text-ink-3">{meta.code}</div>
              <div className="text-[17px] font-bold text-ink">{meta.category}</div>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <GenMeter level={level} />
              <span className="text-[12px] font-semibold text-ink">{meta.levelName}</span>
            </div>
          </div>

          <FichaBlock eyebrow="Capa formal">
            <Row k="Operación" v={meta.operation} />
            <Row k="Ocupación" v={`${meta.occupation} (${bandText(level)})`} />
            <Row k="Retícula" v="9 × 9 módulos (81)" />
          </FichaBlock>

          <FichaBlock eyebrow="Capa semántica">
            <p className="text-[13px] leading-relaxed text-ink-2">{meta.description}</p>
          </FichaBlock>

          <FichaBlock eyebrow="Capa accesible">
            <Row k="Etiqueta" v={meta.shortLabel} />
            <Row k="Lectura fácil" v={meta.easyText} />
            <Row k="Acción" v={meta.action} />
            <Row k="Texto alt." v={meta.alt} />
          </FichaBlock>

          <div className="flex flex-col gap-3 rounded-sm border border-line bg-sunken p-3.5">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-high">Riesgo de mala interpretación</div>
              <p className="mt-1 text-[12px] leading-snug text-ink-2">{meta.risk}</p>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Validación con usuarios</div>
              <p className="mt-1 text-[12px] leading-snug text-ink-2">{meta.validation}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* matriz 7×5 — familia completa */}
      <section className="border-t border-line px-5 py-6 md:px-8">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">Sistema completo · 7 categorías × 5 niveles</span>
          <span className="font-mono text-[11px] text-ink-3">35 especímenes</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            {/* encabezado de niveles */}
            <div className="grid items-end gap-2 pb-2" style={{ gridTemplateColumns: "92px repeat(5, 1fr)" }}>
              <span />
              {GEN_LEVELS.map((lv) => (
                <span key={lv.idx} className="text-center text-[10px] font-medium text-ink-3">{lv.short}</span>
              ))}
            </div>
            {all.map(({ cat, cells }) => (
              <div key={cat.id} className="grid items-center gap-2 border-t border-line py-2" style={{ gridTemplateColumns: "92px repeat(5, 1fr)" }}>
                <div className="min-w-0 pr-1">
                  <div className="truncate text-[12px] font-semibold text-ink">{cat.name}</div>
                  <div className="font-mono text-[10px] text-ink-3">{cat.code}</div>
                </div>
                {cells.map(({ level: l, result: r, meta: m }) => {
                  const active = cat.id === category && l === level;
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setLevel(l);
                      }}
                      title={`${m.code} · ${m.levelName}`}
                      className={cx(
                        "mx-auto flex aspect-square w-full max-w-[64px] items-center justify-center rounded-sm border p-1 transition duration-150 ease-out active:scale-[0.96]",
                        active ? "border-ink bg-sunken" : "border-line bg-paper hover:border-line-strong",
                      )}
                    >
                      <VPictogram result={r} meta={m} colorMode="mono" />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FichaBlock({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-accent">{eyebrow}</span>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2 text-[13px] leading-snug">
      <span className="w-[78px] shrink-0 text-ink-3">{k}</span>
      <span className="flex-1 text-ink">{v}</span>
    </div>
  );
}

/** medidor de 5 segmentos (redundancia sin color) */
function GenMeter({ level }: { level: GenLevel }) {
  return (
    <span aria-hidden className="inline-flex items-end gap-[3px]" style={{ height: 18 }}>
      {GEN_LEVEL_IDS.map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 6 + i * 3,
            borderRadius: 1,
            background: i <= level ? "var(--color-ink)" : "var(--color-line)",
          }}
        />
      ))}
    </span>
  );
}
