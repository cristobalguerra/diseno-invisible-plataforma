import { forwardRef } from "react";
import type { CategoryId, ColorMode, Severity, Variant } from "../../lib/types";
import { getCategory, levelCode, SEVERITY_COLOR } from "../../data/catalog";
import { wrapText } from "../../lib/svg";
import { GLYPHS } from "./glyphs";

const W = 320;
const H = 440;

/**
 * Señal física autocontenida (paper §5.3): glifo + medidor de 3 barras +
 * etiqueta + decisión + código. Es la unidad que se exporta e instala.
 * Todo se dibuja en SVG para una rasterización/exportación vectorial limpia.
 */
export const SignCard = forwardRef<SVGSVGElement, {
  category: CategoryId;
  sev: Severity;
  colorMode?: ColorMode;
  variant?: Variant;
  size?: number;
}>(function SignCard({ category, sev, colorMode = "color", variant = "outline", size = W }, ref) {
  const cat = getCategory(category);
  const level = cat.levels[sev];
  const code = levelCode(category, sev);
  const Glyph = GLYPHS[category];
  const accent = colorMode === "color" ? SEVERITY_COLOR[sev] : "var(--color-ink)";

  const meterH = [10, 15, 20];
  const meterX = W - 20 - (6 * 3 + 4 * 2);
  const decisionLines = wrapText(level.decision, 34);

  const gScale = 150 / 96;
  const gx = (W - 150) / 2;
  const gy = 64;

  return (
    <svg
      ref={ref}
      width={size}
      height={(size * H) / W}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${cat.name}: ${level.label}`}
      style={{ color: "var(--color-ink)", display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x={1} y={1} width={W - 2} height={H - 2} rx={12} fill="var(--color-paper)" stroke="var(--color-line-strong)" strokeWidth={1.5} />

      {/* cabecera: código + medidor */}
      <text x={20} y={34} className="mono" fontSize={13} fontWeight={500} fill="var(--color-ink-3)" letterSpacing="0.5">
        {code}
      </text>
      <g>
        {[0, 1, 2].map((i) => (
          <rect
            key={i}
            x={meterX + i * 10}
            y={44 - meterH[i]}
            width={6}
            height={meterH[i]}
            rx={1}
            fill={i <= sev ? accent : "var(--color-line)"}
          />
        ))}
      </g>
      <line x1={20} y1={54} x2={W - 20} y2={54} stroke="var(--color-line)" strokeWidth={1} />

      {/* glifo */}
      <g transform={`translate(${gx} ${gy}) scale(${gScale})`} style={{ color: accent }}>
        <Glyph sev={sev} sw={5} variant={variant} />
      </g>

      <line x1={20} y1={252} x2={W - 20} y2={252} stroke="var(--color-line)" strokeWidth={1} />

      {/* etiqueta + mensaje + decisión */}
      <text x={20} y={286} fontSize={23} fontWeight={700} fill="var(--color-ink)" letterSpacing="-0.3">
        {level.label}
      </text>
      <text x={20} y={312} fontSize={14} fontWeight={500} fill="var(--color-ink-2)">
        {level.message}
      </text>
      <text x={20} y={342} fontSize={13} fill="var(--color-ink-2)">
        {decisionLines.map((ln, i) => (
          <tspan key={i} x={20} dy={i === 0 ? 0 : 17}>
            {ln}
          </tspan>
        ))}
      </text>

      {/* pie: categoría + comprensión */}
      <line x1={20} y1={H - 42} x2={W - 20} y2={H - 42} stroke="var(--color-line)" strokeWidth={1} />
      <text x={20} y={H - 22} className="mono" fontSize={11} fill="var(--color-ink-3)" letterSpacing="0.4">
        {cat.name.toUpperCase()}
      </text>
      {level.comprehension != null && (
        <text x={W - 20} y={H - 22} className="mono" fontSize={11} fill="var(--color-ink-3)" textAnchor="end">
          ISO 9186 · {level.comprehension}%
        </text>
      )}
    </svg>
  );
});
