import { forwardRef } from "react";
import type { CategoryId, ColorMode, Severity, Variant } from "../../lib/types";
import { GLYPHS } from "./glyphs";
import { SEVERITY_COLOR } from "../../data/catalog";

export interface PictogramProps {
  category: CategoryId;
  sev: Severity;
  size?: number;
  stroke?: number;
  variant?: Variant;
  colorMode?: ColorMode;
  showGrid?: boolean;
  showSafeArea?: boolean;
  title?: string;
}

/**
 * Renderiza un pictograma del sistema en un viewBox 96×96.
 * El color se aplica vía `color` (currentColor en los glifos); en modo `mono`
 * usa la tinta, de modo que el nivel se lee por forma + cantidad sin color.
 */
export const Pictogram = forwardRef<SVGSVGElement, PictogramProps>(function Pictogram(
  { category, sev, size = 96, stroke = 5, variant = "outline", colorMode = "color", showGrid = false, showSafeArea = false, title },
  ref,
) {
  const Glyph = GLYPHS[category];
  const color = colorMode === "color" ? SEVERITY_COLOR[sev] : "var(--color-ink)";
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 96 96"
      role="img"
      aria-label={title}
      style={{ color, display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      {showGrid && (
        <g stroke="var(--color-line)" strokeWidth={0.5} opacity={0.7}>
          {Array.from({ length: 7 }, (_, i) => (i + 1) * 12).map((p) => (
            <line key={`v${p}`} x1={p} y1={0} x2={p} y2={96} />
          ))}
          {Array.from({ length: 7 }, (_, i) => (i + 1) * 12).map((p) => (
            <line key={`h${p}`} x1={0} y1={p} x2={96} y2={p} />
          ))}
        </g>
      )}
      {showSafeArea && (
        <rect x={12} y={12} width={72} height={72} rx={4} fill="none" stroke="var(--color-accent)" strokeWidth={0.75} strokeDasharray="3 3" opacity={0.6} />
      )}
      <Glyph sev={sev} sw={stroke} variant={variant} />
    </svg>
  );
});
