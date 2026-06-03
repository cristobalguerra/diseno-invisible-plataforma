import { forwardRef, type JSX } from "react";
import { getCategory, CATEGORY_COLOR } from "../../data/catalog";
import { arc, polar } from "../../lib/svg";
import { mulberry32 } from "../../lib/generative/rng";
import { globalLoad } from "../../lib/labels/profiles";
import { RING_ORDER, type SensorProfile } from "../../lib/labels/types";

const VB = 200;
const CX = 100;
const CY = 100;
const INNER_R = 22;
const SECTOR_MAX_R = 82;
const OUTER_R = 88;
const PEAK_R = 93;
const HUB_R = 9;
const STEP = 360 / RING_ORDER.length;
const HALF_BAND = (STEP / 2) * 0.8;

/** nivel de detalle del sello: 1 mínimo · 2 medio · 3 completo */
export type Complexity = 1 | 2 | 3;

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface SealProps {
  profile: SensorProfile;
  colorMode?: "color" | "mono";
  complexity?: Complexity;
}

/**
 * SELLO SENSORIAL. Estructura circular-radial fija: cada categoría ocupa un
 * sector angular FIJO y sus parámetros se traducen a atributos gráficos.
 * El nivel de COMPLEJIDAD controla cuántos parámetros se expresan:
 *   1 → solo intensidad (longitud) y duración (grosor): un radio por categoría
 *   2 → + pico, fragmentación leve y orden (sin jitter, sin fondo)
 *   3 → todos: variabilidad, predictibilidad, fuente y densidad global
 */
export const SensorSeal = forwardRef<SVGSVGElement, SealProps>(function SensorSeal(
  { profile, colorMode = "mono", complexity = 1 },
  ref,
) {
  const load = globalLoad(profile);
  const bgRings = complexity === 1 ? 0 : complexity === 2 ? Math.max(1, Math.round(load * 2)) : 2 + Math.round(load * 4);

  const bg: JSX.Element[] = [];
  for (let k = 0; k < bgRings; k++) {
    const r = lerp(30, 78, bgRings === 1 ? 0.62 : k / (bgRings - 1));
    bg.push(<circle key={k} cx={CX} cy={CY} r={r} fill="none" stroke="var(--color-line)" strokeWidth={0.4} opacity={0.6} />);
  }

  const sectors: JSX.Element[] = [];
  const accents: JSX.Element[] = [];

  RING_ORDER.forEach((id, i) => {
    const p = profile.params[id];
    const centerDeg = i * STEP;
    const color = colorMode === "color" ? CATEGORY_COLOR[id] : "var(--color-ink)";
    const op = 0.45 + 0.55 * p.confidence;
    const extentR = lerp(INNER_R + 4, SECTOR_MAX_R, p.intensity);

    if (complexity === 1) {
      // un solo radio: longitud = intensidad, grosor = duración
      const sw = lerp(1.6, 5.5, p.duration);
      const [x0, y0] = polar(CX, CY, INNER_R + 4, centerDeg);
      const [x1, y1] = polar(CX, CY, extentR, centerDeg);
      sectors.push(
        <g key={id} opacity={op}>
          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </g>,
      );
      return;
    }

    const sw = 0.7 + 3.2 * p.duration;
    const arcCount = complexity === 2 ? Math.min(3, 1 + Math.round(4 * p.intensity)) : 2 + Math.round(6 * p.intensity);
    const segs = 1 + Math.round(p.variability * (complexity === 2 ? 2 : 5));
    const gapFrac = 0.12 + p.variability * (complexity === 2 ? 0.3 : 0.45);
    const jitter = complexity === 2 ? 0 : 1 - p.predictability;
    const rng = mulberry32(hashStr(profile.id) ^ Math.imul(i + 1, 2654435761));

    const paths: JSX.Element[] = [];
    for (let j = 0; j < arcCount; j++) {
      const t = arcCount === 1 ? 0.5 : j / (arcCount - 1);
      const r = lerp(INNER_R + 4, extentR, t) + (rng() - 0.5) * 2 * jitter * 3;
      const rot = (rng() - 0.5) * 2 * jitter * HALF_BAND * 0.5;
      const total = 2 * HALF_BAND;
      const step = total / segs;
      const segLen = step * (1 - gapFrac);
      for (let s = 0; s < segs; s++) {
        const s0 = centerDeg - HALF_BAND + rot + s * step;
        paths.push(
          <path key={`${j}-${s}`} d={arc(CX, CY, Math.max(INNER_R + 2, r), s0, s0 + segLen)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />,
        );
      }
    }

    // marcador secundario discreto (fuente) solo en complejidad completa
    let marker: JSX.Element | null = null;
    if (complexity === 3) {
      const [mx, my] = polar(CX, CY, 15, centerDeg);
      if (p.source === "sensor") marker = <circle cx={mx} cy={my} r={1.9} fill={color} />;
      else if (p.source === "observation") marker = <circle cx={mx} cy={my} r={1.9} fill="none" stroke={color} strokeWidth={0.7} />;
      else marker = <rect x={mx - 1.6} y={my - 1.6} width={3.2} height={3.2} fill={color} transform={`rotate(45 ${mx} ${my})`} />;
    }

    sectors.push(
      <g key={id} opacity={op}>
        {paths}
        {marker}
      </g>,
    );

    // acento de pico en el anillo exterior
    const half = complexity === 2 ? 1.5 + p.peak * 4 : 2 + p.peak * 7;
    accents.push(
      <path
        key={id}
        d={arc(CX, CY, PEAK_R, centerDeg - half, centerDeg + half)}
        fill="none"
        stroke={color}
        strokeWidth={complexity === 2 ? 1.5 + p.peak * 2.5 : 2 + p.peak * 3.5}
        strokeLinecap="round"
      />,
    );
  });

  const ticks = RING_ORDER.map((id, i) => {
    const [x0, y0] = polar(CX, CY, HUB_R + 1.5, i * STEP);
    const [x1, y1] = polar(CX, CY, HUB_R + 4.5, i * STEP);
    return <line key={id} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--color-line-strong)" strokeWidth={0.8} />;
  });

  return (
    <svg ref={ref} viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" role="img" aria-label={`Sello sensorial ${profile.code} · ${profile.name}`} xmlns="http://www.w3.org/2000/svg">
      <title>{`Sello sensorial ${profile.code} · ${profile.name}`}</title>
      {bg}
      {sectors}
      {accents}
      <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="var(--color-line-strong)" strokeWidth={1.2} />
      {ticks}
      <circle cx={CX} cy={CY} r={HUB_R} fill="var(--color-paper)" stroke="var(--color-line-strong)" strokeWidth={1} />
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
