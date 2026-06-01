import type { ColorMode, Severity } from "../../lib/types";
import { SEVERITY_COLOR } from "../../data/catalog";

/**
 * Medidor de 3 segmentos tipo señal: el nº de barras llenas (1/2/3) codifica el
 * nivel sin depender del color. Es la redundancia perceptiva del sistema.
 */
export function LevelMeter({
  sev,
  colorMode = "color",
  height = 14,
  gap = 3,
  barWidth = 5,
}: {
  sev: Severity;
  colorMode?: ColorMode;
  height?: number;
  gap?: number;
  barWidth?: number;
}) {
  const heights = [0.5, 0.75, 1].map((m) => Math.round(height * m));
  const on = colorMode === "color" ? SEVERITY_COLOR[sev] : "var(--color-ink)";
  return (
    <span
      aria-hidden
      style={{ display: "inline-flex", alignItems: "flex-end", gap, height }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: barWidth,
            height: heights[i],
            borderRadius: 1,
            background: i <= sev ? on : "var(--color-line)",
          }}
        />
      ))}
    </span>
  );
}
