import { forwardRef, type JSX } from "react";
import type { CategoryId } from "../../lib/types";
import type { GenLevel, GenResult, PictogramMeta } from "../../lib/generative/types";
import { GRID_N } from "../../lib/generative/types";
import { MARK_STYLE } from "../../lib/generative/engine";
import { GEN_LEVELS } from "../../lib/generative/levels";
import { CATEGORY_COLOR } from "../../data/catalog";
import { wrapText } from "../../lib/svg";

interface GlyphOpts {
  result: GenResult;
  category: CategoryId;
  level: GenLevel;
  colorMode?: "color" | "mono";
  contrast?: boolean;
  showGrid?: boolean;
  ox?: number;
  oy?: number;
  size?: number;
}

/**
 * CAPA FORMAL — dibuja la retícula 9×9 dentro de un cuadrado (ox,oy,size).
 * Cada módulo activo es un cuadrado cuyo tamaño codifica el valor; pausa usa
 * trazo (contención) y orientación añade anillos en los nodos de decisión.
 */
function GenGlyph({
  result,
  category,
  level,
  colorMode = "mono",
  contrast = false,
  showGrid = false,
  ox = 0,
  oy = 0,
  size = 96,
}: GlyphOpts): JSX.Element {
  const margin = size * 0.07;
  const module = (size - 2 * margin) / GRID_N;
  const at = (i: number) => ox + margin + i * module;
  const base = module * 0.84;
  const rx = Math.max(0.4, base * 0.09);
  const stroke = MARK_STYLE[category] === "stroke";
  const sw = module * (contrast ? 0.18 : 0.13);

  const color = contrast
    ? "var(--color-ink)"
    : colorMode === "color"
      ? CATEGORY_COLOR[category]
      : "var(--color-ink)";
  const nodeColor = colorMode === "color" && !contrast ? "var(--color-accent)" : "var(--color-ink)";

  const rects: JSX.Element[] = [];
  for (let y = 0; y < GRID_N; y++) {
    for (let x = 0; x < GRID_N; x++) {
      const v = result.grid[y][x];
      if (v <= 0) continue;
      const vv = contrast ? 1 : v;
      const side = base * (0.44 + 0.56 * vv);
      const cx = at(x) + module / 2;
      const cy = at(y) + module / 2;
      rects.push(
        <rect
          key={`${x}-${y}`}
          x={cx - side / 2}
          y={cy - side / 2}
          width={side}
          height={side}
          rx={rx}
          fill={stroke ? "none" : color}
          stroke={stroke ? color : "none"}
          strokeWidth={stroke ? sw : 0}
        />,
      );
    }
  }

  return (
    <g>
      {showGrid && (
        <g stroke="var(--color-line)" strokeWidth={0.4} opacity={0.8}>
          {Array.from({ length: GRID_N + 1 }, (_, i) => (
            <line key={`v${i}`} x1={at(i)} y1={oy + margin} x2={at(i)} y2={oy + size - margin} />
          ))}
          {Array.from({ length: GRID_N + 1 }, (_, i) => (
            <line key={`h${i}`} x1={ox + margin} y1={at(i)} x2={ox + size - margin} y2={at(i)} />
          ))}
        </g>
      )}
      {rects}
      {result.nodes.map(([nx, ny], i) => (
        <circle
          key={`n${i}`}
          cx={at(nx) + module / 2}
          cy={at(ny) + module / 2}
          r={base * 0.7}
          fill="none"
          stroke={nodeColor}
          strokeWidth={module * 0.14}
        />
      ))}
    </g>
  );
}

/* ---- versiones exportables (cada una es un <svg> autónomo) -------------- */

interface VersionProps {
  result: GenResult;
  meta: PictogramMeta;
  colorMode?: "color" | "mono";
  showGrid?: boolean;
}

/** 1 · Solo pictograma (fondo transparente) */
export const VPictogram = forwardRef<SVGSVGElement, VersionProps>(function VPictogram(
  { result, meta, colorMode = "mono", showGrid = false },
  ref,
) {
  return (
    <svg ref={ref} viewBox="0 0 96 96" width="100%" height="100%" role="img" aria-label={meta.alt} xmlns="http://www.w3.org/2000/svg">
      <title>{meta.alt}</title>
      <GenGlyph result={result} category={meta.categoryId} level={meta.level} colorMode={colorMode} showGrid={showGrid} size={96} />
    </svg>
  );
});

/** 2 · Con etiqueta corta */
export const VLabeled = forwardRef<SVGSVGElement, VersionProps>(function VLabeled(
  { result, meta, colorMode = "mono", showGrid = false },
  ref,
) {
  return (
    <svg ref={ref} viewBox="0 0 96 126" width="100%" height="100%" role="img" aria-label={meta.alt} xmlns="http://www.w3.org/2000/svg">
      <title>{meta.alt}</title>
      <rect x={0} y={0} width={96} height={126} fill="var(--color-paper)" />
      <GenGlyph result={result} category={meta.categoryId} level={meta.level} colorMode={colorMode} showGrid={showGrid} size={96} />
      <line x1={14} y1={98} x2={82} y2={98} stroke="var(--color-line)" strokeWidth={0.6} />
      <text x={48} y={111} textAnchor="middle" fontSize={8.5} fontWeight={600} fill="var(--color-ink)">
        {meta.shortLabel}
      </text>
      <text x={48} y={120} textAnchor="middle" fontSize={6} className="mono" fill="var(--color-ink-3)">
        {meta.code} · {meta.occupation}
      </text>
    </svg>
  );
});

/** 3 · Alto contraste (tinta plena sobre papel, módulos completos) */
export const VHighContrast = forwardRef<SVGSVGElement, VersionProps>(function VHighContrast(
  { result, meta },
  ref,
) {
  return (
    <svg ref={ref} viewBox="0 0 96 96" width="100%" height="100%" role="img" aria-label={meta.alt} xmlns="http://www.w3.org/2000/svg">
      <title>{meta.alt}</title>
      <rect x={0} y={0} width={96} height={96} fill="var(--color-paper)" />
      <GenGlyph result={result} category={meta.categoryId} level={meta.level} colorMode="mono" contrast size={96} />
    </svg>
  );
});

/** 4 · Ficha técnica con texto alternativo */
export const VSheet = forwardRef<SVGSVGElement, VersionProps>(function VSheet(
  { result, meta, colorMode = "mono" },
  ref,
) {
  const W = 248;
  const H = 306;
  const altLines = wrapText(meta.alt, 50).slice(0, 4);
  const bars = GEN_LEVELS.map((_, i) => i);
  const mx = 18;
  const bw = 11;
  const bg = 5;

  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={meta.alt} xmlns="http://www.w3.org/2000/svg">
      <title>{meta.alt}</title>
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} fill="var(--color-paper)" stroke="var(--color-line-strong)" strokeWidth={1} rx={5} />

      <text x={mx} y={26} fontSize={11} className="mono" fill="var(--color-ink-3)">{meta.code}</text>
      <text x={W - mx} y={26} fontSize={9} textAnchor="end" className="mono" fill="var(--color-ink-3)" letterSpacing={1}>
        {meta.levelName.toUpperCase()}
      </text>
      <text x={mx} y={44} fontSize={15} fontWeight={700} fill="var(--color-ink)">{meta.category}</text>
      <line x1={mx} y1={52} x2={W - mx} y2={52} stroke="var(--color-line)" strokeWidth={0.8} />

      <GenGlyph result={result} category={meta.categoryId} level={meta.level} colorMode={colorMode} ox={49} oy={60} size={150} />

      {/* medidor de 5 segmentos */}
      <g transform={`translate(${mx}, 232)`}>
        {bars.map((i) => {
          const h = 8 + i * 3.2;
          const on = i <= meta.level;
          return (
            <rect
              key={i}
              x={i * (bw + bg)}
              y={20 - h}
              width={bw}
              height={h}
              rx={1}
              fill={on ? "var(--color-ink)" : "var(--color-line)"}
            />
          );
        })}
        <text x={5 * (bw + bg) + 6} y={17} fontSize={8} className="mono" fill="var(--color-ink-3)">
          {meta.occupation} ocupación
        </text>
      </g>

      <text x={mx} y={272} fontSize={7.5} className="mono" fill="var(--color-ink-3)" letterSpacing={0.5}>
        {meta.operation.toUpperCase()}
      </text>
      {altLines.map((ln, i) => (
        <text key={i} x={mx} y={284 + i * 9} fontSize={8} fill="var(--color-ink-2)">{ln}</text>
      ))}
    </svg>
  );
});

export { GenGlyph };
