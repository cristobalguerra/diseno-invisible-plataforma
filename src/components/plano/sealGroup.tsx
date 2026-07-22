import type { CSSProperties } from "react";
import { CATEGORY_COLOR } from "../../data/catalog";
import { polar } from "../../lib/svg";
import { RING_ORDER, type SensorProfile } from "../../lib/labels/types";

/**
 * SELLO SENSORIAL como `<g>` embebible (no `<svg>`), para componerlo dentro de una
 * lámina mayor y exportarlo con el resto del plano. Mantiene la geometría del sello
 * original (viewBox 200, radio externo 88) escalada por `r`: cada categoría ocupa un
 * sector angular fijo y se dibuja como un radio en su color.
 *   longitud → intensidad · grosor → duración · opacidad → confianza
 *
 * `idSuffix` hace único el id del filtro de resplandor: dos sellos en el mismo SVG no
 * colisionan (el original codificaba el id solo con profile.id).
 */
const STEP = 360 / RING_ORDER.length;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const spokeTransition: CSSProperties = {
  transition:
    "stroke-dashoffset 260ms cubic-bezier(0.23, 1, 0.32, 1), stroke-width 220ms ease-out, opacity 200ms ease-out",
};

export function SealGroup({
  profile,
  cx,
  cy,
  r,
  idSuffix,
  lit = true,
}: {
  profile: SensorProfile;
  cx: number;
  cy: number;
  /** radio externo del sello en unidades del SVG contenedor */
  r: number;
  /** sufijo único para el id del filtro (evita colisiones al embeber varios) */
  idSuffix?: string;
  /** false = radios sin revelar (estado "apagado" para animar la entrada) */
  lit?: boolean;
}) {
  const s = r / 88; // factor de escala respecto al sello original (OUTER_R = 88)
  const innerR = 22 * s;
  const sectorMaxR = 82 * s;
  const hubR = 9 * s;
  const fid = `glw-${(idSuffix ?? profile.id).replace(/\W/g, "")}`;

  const spokes = RING_ORDER.map((id, i) => {
    const p = profile.params[id];
    const deg = i * STEP;
    const op = 0.5 + 0.5 * p.confidence;
    const sw = lerp(1.8, 5.5, p.duration) * s;
    const frac = lit ? 0.06 + 0.94 * p.intensity : 0;
    const [x0, y0] = polar(cx, cy, innerR + 3 * s, deg);
    const [x1, y1] = polar(cx, cy, sectorMaxR, deg);
    return (
      <line
        key={id}
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={CATEGORY_COLOR[id]}
        strokeWidth={sw}
        strokeLinecap="round"
        opacity={op}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - frac}
        style={spokeTransition}
      />
    );
  });

  const ticks = RING_ORDER.map((id, i) => {
    const [x0, y0] = polar(cx, cy, hubR + 2 * s, i * STEP);
    const [x1, y1] = polar(cx, cy, hubR + 5.5 * s, i * STEP);
    return (
      <line key={id} x1={x0} y1={y0} x2={x1} y2={y1} stroke={CATEGORY_COLOR[id]} strokeWidth={1.6 * s} strokeLinecap="round" />
    );
  });

  return (
    <g>
      <defs>
        <filter id={fid} x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation={1.7 * s} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--color-line)" strokeWidth={s} />
      <g filter={`url(#${fid})`}>{spokes}</g>
      {ticks}
      <circle cx={cx} cy={cy} r={hubR} fill="var(--color-canvas)" stroke="var(--color-line-strong)" strokeWidth={s} />
      <circle cx={cx} cy={cy} r={2.1 * s} fill="var(--color-ink)" />
    </g>
  );
}
