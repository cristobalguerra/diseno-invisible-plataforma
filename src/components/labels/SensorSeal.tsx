import { forwardRef, useEffect, useState } from "react";
import { getCategory, CATEGORY_COLOR } from "../../data/catalog";
import { polar } from "../../lib/svg";
import { RING_ORDER, type SensorProfile } from "../../lib/labels/types";
import { SealGroup } from "../plano/sealGroup";

const VB = 200;
const CX = 100;
const CY = 100;
const OUTER_R = 88;
const HUB_R = 9;
const STEP = 360 / RING_ORDER.length;

/**
 * SELLO SENSORIAL. `<svg>` autónomo que envuelve el grupo embebible `SealGroup`
 * (ver components/plano/sealGroup.tsx). Cada categoría ocupa un sector angular FIJO
 * y se dibuja como un radio en su color: longitud → intensidad, grosor → duración,
 * opacidad → confianza.
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

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Sello sensorial ${profile.code} · ${profile.site} · ${profile.name}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{`Sello sensorial ${profile.code} · ${profile.name}`}</title>
      <SealGroup profile={profile} cx={CX} cy={CY} r={OUTER_R} idSuffix={profile.id} lit={lit} />
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
