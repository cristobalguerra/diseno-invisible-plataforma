import type { JSX } from "react";
import type { CategoryId, Severity, Variant } from "../../lib/types";
import { arc, arrow, polar, sector } from "../../lib/svg";

export interface GlyphProps {
  sev: Severity;
  sw: number;
  variant: Variant;
}

const base = (sw: number) =>
  ({
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  }) as const;

const solidFill = (variant: Variant) => (variant === "solid" ? "currentColor" : "none");

/* 1 · SONIDO — altavoz + ondas; el nivel = nº de ondas (1/2/3) */
function Sound({ sev, sw, variant }: GlyphProps): JSX.Element {
  const waves = sev + 1;
  const radii = [12, 22, 32];
  return (
    <g {...base(sw)}>
      <path d="M16 42 H26 L40 30 V66 L26 54 H16 Z" fill={solidFill(variant)} />
      {radii.slice(0, waves).map((r, i) => (
        <path key={i} d={arc(42, 48, r, 40, 140)} />
      ))}
    </g>
  );
}

/* 2 · LUZ — sol; el nivel = nº de rayos (4/8/12) */
function Light({ sev, sw, variant }: GlyphProps): JSX.Element {
  const rays = [4, 8, 12][sev];
  const cx = 48, cy = 48;
  return (
    <g {...base(sw)}>
      <circle cx={cx} cy={cy} r={13} fill={solidFill(variant)} />
      {Array.from({ length: rays }, (_, i) => {
        const deg = (360 / rays) * i;
        const [x0, y0] = polar(cx, cy, 20, deg);
        const [x1, y1] = polar(cx, cy, 29, deg);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} />;
      })}
    </g>
  );
}

/* 3 · FLUJO — figuras; el nivel = nº de personas (1/2/3) */
function Flow({ sev, sw, variant }: GlyphProps): JSX.Element {
  const xs = [[48], [38, 58], [30, 48, 66]][sev];
  return (
    <g {...base(sw)}>
      {xs.map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy={33} r={6.5} fill={solidFill(variant)} />
          <path
            d={`M ${cx - 10} 66 C ${cx - 10} 50 ${cx - 6} 45 ${cx} 45 C ${cx + 6} 45 ${cx + 10} 50 ${cx + 10} 66 Z`}
            fill={solidFill(variant)}
          />
        </g>
      ))}
    </g>
  );
}

/* 4 · SATURACIÓN VISUAL — marco con marcas; el nivel = densidad (1/4/9) */
function Visual({ sev, sw }: GlyphProps): JSX.Element {
  const n = sev + 1; // 1,2,3 por lado
  const a0 = 30, span = 36, cell = span / n, ms = cell * 0.58;
  const marks: JSX.Element[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = a0 + cell * (i + 0.5) - ms / 2;
      const y = a0 + cell * (j + 0.5) - ms / 2;
      marks.push(<rect key={`${i}-${j}`} x={x} y={y} width={ms} height={ms} rx={1.5} fill="currentColor" stroke="none" />);
    }
  }
  return (
    <g {...base(sw)}>
      <rect x={22} y={22} width={52} height={52} rx={5} />
      {marks}
    </g>
  );
}

/* 5 · ESPERA — reloj con sector transcurrido creciente (120°/210°/300°) */
function Wait({ sev, sw, variant }: GlyphProps): JSX.Element {
  const cx = 48, cy = 48, r = 25;
  const sweep = [120, 210, 300][sev];
  const [hx, hy] = polar(cx, cy, r - 9, sweep);
  return (
    <g {...base(sw)}>
      <path d={sector(cx, cy, r, 0, sweep)} fill="currentColor" stroke="none" opacity={variant === "solid" ? 0.9 : 0.16} />
      <circle cx={cx} cy={cy} r={r} />
      <line x1={cx} y1={cy} x2={cx} y2={cy - r + 8} />
      <line x1={cx} y1={cy} x2={hx} y2={hy} />
      <circle cx={cx} cy={cy} r={2.4} fill="currentColor" stroke="none" />
    </g>
  );
}

/* 6 · ORIENTACIÓN — clara: flecha · media: bifurcación · confusa: cruce */
function Orientation({ sev, sw }: GlyphProps): JSX.Element {
  const g = base(sw);
  if (sev === 0) {
    const a = arrow(48, 72, 48, 24, 11);
    return (
      <g {...g}>
        <path d={a.shaft} />
        <path d={a.head} fill="none" />
      </g>
    );
  }
  if (sev === 1) {
    const left = arrow(48, 50, 28, 26, 9);
    const right = arrow(48, 50, 68, 26, 9);
    return (
      <g {...g}>
        <path d="M48 74 L48 50" />
        <path d={left.shaft} />
        <path d={left.head} />
        <path d={right.shaft} />
        <path d={right.head} />
        <circle cx={48} cy={50} r={2.6} fill="currentColor" stroke="none" />
      </g>
    );
  }
  const dirs: [number, number][] = [[24, 24], [72, 24], [24, 72], [72, 72]];
  return (
    <g {...g}>
      {dirs.map(([x, y], i) => {
        const a = arrow(48, 48, x, y, 8);
        return (
          <g key={i}>
            <path d={a.shaft} />
            <path d={a.head} />
          </g>
        );
      })}
      <circle cx={48} cy={48} r={3} fill="currentColor" stroke="none" />
    </g>
  );
}

/* 7 · PAUSA — figura sentada; recinto sólido / discontinuo / tachado */
function Pause({ sev, sw, variant }: GlyphProps): JSX.Element {
  const seat = (
    <g>
      <circle cx={42} cy={26} r={6.5} fill={solidFill(variant)} />
      <path d="M42 33 L43 52 L62 52" />
      <path d="M62 52 L62 70" />
      <path d="M30 70 L66 70" />
    </g>
  );
  return (
    <g {...base(sw)}>
      {sev === 0 && <rect x={18} y={14} width={60} height={64} rx={8} opacity={0.9} />}
      {sev === 1 && <rect x={18} y={14} width={60} height={64} rx={8} strokeDasharray="6 6" />}
      {seat}
      {sev === 2 && <line x1={24} y1={74} x2={74} y2={22} strokeWidth={sw + 1} />}
    </g>
  );
}

export const GLYPHS: Record<CategoryId, (p: GlyphProps) => JSX.Element> = {
  sound: Sound,
  light: Light,
  flow: Flow,
  visual: Visual,
  wait: Wait,
  orientation: Orientation,
  pause: Pause,
};
