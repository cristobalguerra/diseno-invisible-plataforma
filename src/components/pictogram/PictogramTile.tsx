import type { CategoryId, ColorMode, Severity, Variant } from "../../lib/types";
import { getCategory, levelCode } from "../../data/catalog";
import { Pictogram } from "./Pictogram";
import { LevelMeter } from "./LevelMeter";

export function PictogramTile({
  category,
  sev,
  colorMode = "color",
  variant = "outline",
  showGrid = false,
  selected = false,
  onClick,
}: {
  category: CategoryId;
  sev: Severity;
  colorMode?: ColorMode;
  variant?: Variant;
  showGrid?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  const cat = getCategory(category);
  const level = cat.levels[sev];
  const code = levelCode(category, sev);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="group flex flex-col rounded-sm border bg-paper p-3 text-left transition duration-200 ease-out hover:border-line-strong active:scale-[0.99] focus-visible:outline-none"
      style={selected ? { borderColor: "var(--color-accent)", boxShadow: "inset 0 0 0 1px var(--color-accent)" } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-wide text-ink-3">{code}</span>
        <LevelMeter sev={sev} colorMode={colorMode} height={12} barWidth={4} gap={2.5} />
      </div>

      <div
        className={`my-3 flex h-[104px] items-center justify-center rounded-sm border border-line bg-sunken ${showGrid ? "grid-bg" : ""}`}
      >
        <Pictogram category={category} sev={sev} size={84} variant={variant} colorMode={colorMode} showGrid={showGrid} title={level.label} />
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-semibold leading-tight text-ink">{level.label}</span>
        {level.comprehension != null && (
          <span className="shrink-0 font-mono text-[10px] text-ink-3 tnum" title="Comprensión ISO 9186-1 (ilustrativa)">
            {level.comprehension}%
          </span>
        )}
      </div>
      <span className="mt-0.5 text-[11px] leading-snug text-ink-3">{cat.name} · {level.short}</span>
    </button>
  );
}
