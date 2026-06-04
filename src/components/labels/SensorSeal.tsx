import { forwardRef, useEffect, useState } from "react";
import { getCategory, CATEGORY_COLOR } from "../../data/catalog";
import { polar } from "../../lib/svg";
import { RING_ORDER, type SensorProfile } from "../../lib/labels/types";

const VB = 200;
const CX = 100;
const CY = 100;
const INNER_R = 22;
const SECTOR_MAX_R = 82;
const OUTER_R = 88;
const HUB_R = 9;
const STEP = 360 / RING_ORDER.length;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * SELLO SENSORIAL. Estructura circular-radial fija: cada categoría ocupa un
 * sector angular FIJO y se dibuja como un radio en su COLOR de categoría
 * (la codificación es cromática, por eso el sello existe solo en color).
 *   longitud del radio → intensidad · grosor → duración · opacidad → confianza
 */
export const SensorSeal = forwardRef<SVGSVGElement, { profile: SensorProfile; animateIn?: boolean }>(function SensorSeal(
  { profile, animateIn = false },
  ref,
) {
  // "encendido": al montar (abrir un espacio) los radios se dibujan desde el cubo.
  const [lit, setLit] = useState(!animateIn);
  useEffect(() => {
    if (!animateIn) return;
    const r = requestAnimationFrame(() => setLit(true));
    return () => cancelAnimationFrame(r);
  }, [animateIn]);

  const spokes = RING_ORDER.map((id, i) => {
    const p = profile.params[id];
    const deg = i * STEP;
    const color = CATEGORY_COLOR[id];
    const op = 0.5 + 0.5 * p.confidence;
    const sw = lerp(1.8, 5.5, p.duration);
    // radio a longitud completa; la INTENSIDAD se revela con stroke-dashoffset,
    // así el radio crece/encoge suave al editar el dato (transform/opacity-safe).
    const frac = lit ? 0.06 + 0.94 * p.intensity : 0;
    const [x0, y0] = polar(CX, CY, INNER_R + 3, deg);
    const [x1, y1] = polar(CX, CY, SECTOR_MAX_R, deg);
    return (
      <line
        key={id}
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        opacity={op}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - frac}
        style={{ transition: "stroke-dashoffset 260ms cubic-bezier(0.23, 1, 0.32, 1), stroke-width 220ms ease-out, opacity 200ms ease-out" }}
      />
    );
  });

  // ticks de posición en color: garantizan que las 7 categorías sean visibles
  const ticks = RING_ORDER.map((id, i) => {
    const [x0, y0] = polar(CX, CY, HUB_R + 2, i * STEP);
    const [x1, y1] = polar(CX, CY, HUB_R + 5.5, i * STEP);
    return <line key={id} x1={x0} y1={y0} x2={x1} y2={y1} stroke={CATEGORY_COLOR[id]} strokeWidth={1.6} strokeLinecap="round" />;
  });

  const fid = `glw-${profile.id.replace(/\W/g, "")}`;
  return (
    <svg ref={ref} viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" role="img" aria-label={`Sello sensorial ${profile.code} · ${profile.site} · ${profile.name}`} xmlns="http://www.w3.org/2000/svg">
      <title>{`Sello sensorial ${profile.code} · ${profile.name}`}</title>
      <defs>
        {/* resplandor: cada radio irradia su propio color (lectura encendida) */}
        <filter id={fid} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="var(--color-line)" strokeWidth={1} />
      <g filter={`url(#${fid})`}>{spokes}</g>
      {ticks}
      <circle cx={CX} cy={CY} r={HUB_R} fill="var(--color-canvas)" stroke="var(--color-line-strong)" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={2.1} fill="var(--color-ink)" />
    </svg>
  );
});

/** Leyenda: muestra qué categoría ocupa cada posición fija del anillo. */
export function SealLegend() {
  const labels = RING_ORDER.map((id, i) => {
    const [tx, ty] = polar(CX, CY, 62, i * STEP);
    const [x0, y0] = polar(CX, CY, 80, i * STEP);
    const [x1, y1] = polar(CX, CY, 86, i * STEP);
    return (
      <g key={id}>
        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--color-line-strong)" strokeWidth={1} />
        <text x={tx} y={ty + 3} textAnchor="middle" fontSize={11} className="mono" fill={CATEGORY_COLOR[id]}>
          {getCategory(id).code}
        </text>
      </g>
    );
  });
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="var(--color-line)" strokeWidth={1} />
      {labels}
      <circle cx={CX} cy={CY} r={HUB_R} fill="none" stroke="var(--color-line)" strokeWidth={1} />
      <text x={CX} y={CY + 3.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--color-ink-3)">DI</text>
    </svg>
  );
}
