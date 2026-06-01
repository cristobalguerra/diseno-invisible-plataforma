import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { CategoryId, ColorMode, Severity, Variant } from "../../lib/types";
import { CATEGORIES } from "../../data/catalog";
import { Eyebrow, Segmented, Toggle, cx } from "../ui/kit";
import { PictogramTile } from "../pictogram/PictogramTile";

const SEVS: Severity[] = [0, 1, 2];

export function Library({ onOpen }: { onOpen: (category: CategoryId, sev: Severity) => void }) {
  const [filter, setFilter] = useState<CategoryId | "all">("all");
  const [colorMode, setColorMode] = useState<ColorMode>("color");
  const [variant, setVariant] = useState<Variant>("outline");
  const [grid, setGrid] = useState(false);

  const shown = useMemo(
    () => (filter === "all" ? CATEGORIES : CATEGORIES.filter((c) => c.id === filter)),
    [filter],
  );

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-8">
        <Eyebrow>01 · Biblioteca</Eyebrow>
        <h1 className="mt-2 max-w-[34ch] text-[26px] font-bold leading-[1.1] tracking-tight text-ink md:text-[32px]">
          21 especímenes del sistema sensorial
        </h1>
        <p className="mt-2.5 max-w-[58ch] text-[14px] leading-relaxed text-ink-2">
          Siete categorías, tres niveles cada una. El nivel se lee por la forma y la cantidad
          de elementos antes que por el color: medidor de tres barras, glifo y etiqueta siempre
          juntos. Abre cualquier especimen para parametrizarlo y exportarlo.
        </p>
      </header>

      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-line bg-canvas/95 px-5 py-3 backdrop-blur md:px-8">
        <div className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto px-1">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Todas
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.name}
            </FilterChip>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Segmented
            size="sm"
            value={colorMode}
            onChange={setColorMode}
            options={[
              { value: "color", label: "Color" },
              { value: "mono", label: "Mono", title: "Sin color: el nivel se lee por forma y cantidad" },
            ]}
          />
          <Segmented
            size="sm"
            value={variant}
            onChange={setVariant}
            options={[
              { value: "outline", label: "Línea" },
              { value: "solid", label: "Sólido" },
            ]}
          />
          <Toggle checked={grid} onChange={setGrid} label="Retícula" />
        </div>
      </div>

      <div className="flex flex-col gap-10 px-5 py-7 md:px-8 md:py-9">
        {shown.map((cat) => (
          <section key={cat.id}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line pb-2.5">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[12px] font-medium text-ink-3">{cat.code}</span>
                <h2 className="text-[16px] font-bold tracking-tight text-ink">{cat.name}</h2>
                <span className="hidden text-[12px] text-ink-3 sm:inline">
                  {cat.variable} · {cat.scale}
                </span>
              </div>
              {cat.norm && (
                <span className="rounded-full border border-line bg-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-3">
                  {cat.norm}
                </span>
              )}
            </div>
            <p className="mb-4 max-w-[64ch] text-[13px] leading-relaxed text-ink-2">{cat.about}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SEVS.map((sev) => (
                <PictogramTile
                  key={sev}
                  category={cat.id}
                  sev={sev}
                  colorMode={colorMode}
                  variant={variant}
                  showGrid={grid}
                  onClick={() => onOpen(cat.id, sev)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="flex items-center gap-2 border-t border-line px-5 py-5 text-[12px] text-ink-3 md:px-8">
        <ArrowUpRight size={14} />
        Selecciona un especimen para abrirlo en el Editor con sus parámetros precargados.
      </footer>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "shrink-0 rounded-full border px-3 py-1 text-[12px] font-medium transition duration-150 ease-out active:scale-[0.97]",
        active
          ? "border-ink bg-ink text-canvas"
          : "border-line bg-paper text-ink-2 hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
