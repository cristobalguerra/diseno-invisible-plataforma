import { forwardRef } from "react";
import type { Zone } from "../../lib/types";
import { getCategory, SEVERITY_COLOR } from "../../data/catalog";
import { computePriority, LOAD_CATEGORY_IDS, PRIORITY_SEVERITY } from "../../lib/priority";

const PAD = 36;
const COL_MIN = 124;
const CHART_TOP = 64;
const CHART_BOTTOM = 184;
const CHART_H = CHART_BOTTOM - CHART_TOP;
const NODE_Y = 226;
const EQ_BOTTOM = 320;
const EQ_MAX = 28;
const H = 372;

const EQ_H: Record<0 | 1 | 2, number> = { 0: 7, 1: 17, 2: EQ_MAX };

/**
 * Mapa sensorial del recorrido (paper §4.4): perfil de carga zona a zona +
 * marcador de prioridad y huella de las 5 categorías de carga por zona.
 */
export const MapaSensorial = forwardRef<SVGSVGElement, { zones: Zone[]; size?: number }>(
  function MapaSensorial({ zones, size }, ref) {
    const colW = Math.max(COL_MIN, 520 / Math.max(zones.length, 1));
    const W = Math.round(PAD * 2 + colW * zones.length);
    const cx = (i: number) => PAD + colW * (i + 0.5);
    const scoreY = (score: number) => CHART_BOTTOM - (score / 10) * CHART_H;

    const pts = zones.map((z, i) => {
      const pri = computePriority(z.levels);
      return { x: cx(i), y: scoreY(pri.loadScore), score: pri.loadScore, pri, z };
    });

    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const areaPath =
      pts.length > 1
        ? `M ${pts[0].x.toFixed(1)} ${CHART_BOTTOM} ` +
          pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
          ` L ${pts[pts.length - 1].x.toFixed(1)} ${CHART_BOTTOM} Z`
        : "";

    const eqCodes = LOAD_CATEGORY_IDS.map((id) => getCategory(id).code);

    return (
      <svg
        ref={ref}
        width={size ?? W}
        height={size ? (size * H) / W : H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Mapa sensorial del recorrido"
        style={{ color: "var(--color-ink)", display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x={1} y={1} width={W - 2} height={H - 2} rx={12} fill="var(--color-paper)" stroke="var(--color-line-strong)" strokeWidth={1.5} />

        <text x={PAD} y={34} fontSize={14} fontWeight={700} fill="var(--color-ink)" letterSpacing="-0.2">
          Perfil de carga sensorial
        </text>
        <text x={W - PAD} y={34} className="mono" fontSize={11} fill="var(--color-ink-3)" textAnchor="end">
          0–10 por zona
        </text>

        {/* rejilla del eje */}
        {[0, 5, 10].map((t) => {
          const y = scoreY(t);
          return (
            <g key={t}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="var(--color-line)" strokeWidth={1} strokeDasharray={t === 0 ? undefined : "2 3"} />
              <text x={PAD - 8} y={y + 3} className="mono" fontSize={9.5} fill="var(--color-ink-3)" textAnchor="end">
                {t}
              </text>
            </g>
          );
        })}

        {/* área + línea del perfil */}
        {areaPath && <path d={areaPath} fill="var(--color-accent-weak)" opacity={0.7} />}
        {pts.length > 1 && <path d={linePath} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}

        {/* nodos del recorrido */}
        <line x1={cx(0)} y1={NODE_Y} x2={cx(zones.length - 1)} y2={NODE_Y} stroke="var(--color-line-strong)" strokeWidth={1.5} />
        {pts.map((p, i) => {
          const priColor = SEVERITY_COLOR[PRIORITY_SEVERITY[p.pri.level]];
          return (
            <g key={p.z.id}>
              {/* punto del perfil */}
              <circle cx={p.x} cy={p.y} r={3.5} fill="var(--color-paper)" stroke="var(--color-accent)" strokeWidth={2} />

              {/* marcador de prioridad sobre la línea del recorrido */}
              <circle cx={p.x} cy={NODE_Y} r={9} fill={priColor} />
              <circle cx={p.x} cy={NODE_Y} r={3.4} fill="var(--color-paper)" />

              <text x={p.x} y={NODE_Y - 16} className="mono" fontSize={10} fill="var(--color-ink-3)" textAnchor="middle">
                {p.z.code}
              </text>
              <text x={p.x} y={NODE_Y + 28} fontSize={11.5} fontWeight={600} fill="var(--color-ink)" textAnchor="middle">
                {p.z.name.length > 14 ? `${p.z.name.slice(0, 13)}…` : p.z.name}
              </text>

              {/* ecualizador de 5 categorías de carga */}
              <g>
                {LOAD_CATEGORY_IDS.map((id, b) => {
                  const sev = p.z.levels[id];
                  const bw = 6;
                  const gap = 4;
                  const totalW = LOAD_CATEGORY_IDS.length * bw + (LOAD_CATEGORY_IDS.length - 1) * gap;
                  const x0 = p.x - totalW / 2 + b * (bw + gap);
                  const h = EQ_H[sev];
                  return <rect key={id} x={x0} y={EQ_BOTTOM - h} width={bw} height={h} rx={1} fill={SEVERITY_COLOR[sev]} />;
                })}
                <line x1={p.x - 25} y1={EQ_BOTTOM + 1} x2={p.x + 25} y2={EQ_BOTTOM + 1} stroke="var(--color-line)" strokeWidth={1} />
              </g>
            </g>
          );
        })}

        {/* leyenda */}
        <text x={PAD} y={H - 16} className="mono" fontSize={10} fill="var(--color-ink-3)">
          Huella por zona: {eqCodes.join(" · ")}
        </text>
      </svg>
    );
  },
);
