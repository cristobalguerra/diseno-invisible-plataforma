import { forwardRef } from "react";
import { RING_ORDER, type SensorProfile } from "../../lib/labels/types";

/**
 * SÍMBOLO SENSORIAL — sistema paramétrico de 7 conectores viscosos.
 *
 * Un núcleo central (origen) se une a 7 nodos circulares externos (uno por dimensión,
 * a 360°÷7 = 51.43°). Cada unión es un CONECTOR VISCOSO ADAPTATIVO tipo slime elástico:
 * una espina curva suave con un perfil de ancho de 5 zonas —grande · mediano · pequeño ·
 * mediano · grande— que se ensancha al tocar cada nodo y se adelgaza en la cintura. Sin
 * cortes duros; todo funde en una pieza continua.
 *
 *   Vᵢ (lectura 0..1) controla DISTANCIA y TENSIÓN:
 *     distancia Rᵢ = Rmín + Vᵢ·(Rmáx − Rmín)      (1..5 → 40 %..100 %)
 *     tensión: a mayor Vᵢ, cintura más delgada (más estirado, más tenso)
 *
 * Render: CONTORNO (línea blanca, interior transparente) — estética blueprint. La capa
 * `construction` añade retícula, círculos guía, ejes y cotas.
 *
 * Capas nombradas (id / data-name) para lectura y exportación limpias.
 */

const VB = 220;
const CX = 110;
const CY = 110;
const STEP = 360 / RING_ORDER.length; // 51.428…°

const CORE_R = 7; // radio del núcleo (origen)
const R_MAX = 82; // 100 %
const R_MIN_FRAC = 0.4; // 40 %
const NODE_R = 9; // nodos externos, mismo diámetro (bola clara al extremo)
const NODE_FLARE = 5.5; // medio-ancho del cuello al tocar el nodo (< NODE_R → bola distinta)
const WAIST_LO = 5.2; // cintura con lectura 0 (poco tensada)
const WAIST_HI = 2.5; // cintura con lectura 1 (muy tensada, delgada)
const SAMPLES = 40;

const GUIDES = [0.4, 0.55, 0.7, 0.85, 1]; // 1..5

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const f = (n: number) => Math.round(n * 100) / 100;

const rad = (deg: number) => ((deg - 90) * Math.PI) / 180; // 0° arriba, horario
const ptAt = (r: number, deg: number): [number, number] => {
  const a = rad(deg);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

const readingOf = (p: SensorProfile["params"][keyof SensorProfile["params"]]) => clamp01(p.intensity);
const radiusOf = (v: number) => (R_MIN_FRAC + (1 - R_MIN_FRAC) * v) * R_MAX;

type V = [number, number];
const cubic = (a: V, c1: V, c2: V, b: V, t: number): V => {
  const u = 1 - t;
  const k0 = u * u * u, k1 = 3 * u * u * t, k2 = 3 * u * t * t, k3 = t * t * t;
  return [a[0] * k0 + c1[0] * k1 + c2[0] * k2 + b[0] * k3, a[1] * k0 + c1[1] * k1 + c2[1] * k2 + b[1] * k3];
};
const cubicD = (a: V, c1: V, c2: V, b: V, t: number): V => {
  const u = 1 - t;
  const k0 = 3 * u * u, k1 = 6 * u * t, k2 = 3 * t * t;
  return [k0 * (c1[0] - a[0]) + k1 * (c2[0] - c1[0]) + k2 * (b[0] - c2[0]), k0 * (c1[1] - a[1]) + k1 * (c2[1] - c1[1]) + k2 * (b[1] - c2[1])];
};

/** Catmull-Rom escalar sobre 5 valores uniformes en t∈[0,1] → perfil de ancho suave. */
function catmull(vals: number[], t: number): number {
  const n = vals.length - 1;
  const s = t * n;
  let i = Math.floor(s);
  if (i >= n) i = n - 1;
  const fr = s - i;
  const p0 = vals[Math.max(0, i - 1)];
  const p1 = vals[i];
  const p2 = vals[i + 1];
  const p3 = vals[Math.min(n, i + 2)];
  const f2 = fr * fr, f3 = f2 * fr;
  return 0.5 * (2 * p1 + (-p0 + p2) * fr + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f2 + (-p0 + 3 * p1 - 3 * p2 + p3) * f3);
}

/**
 * Conector viscoso: espina cúbica del núcleo al nodo + perfil de medio-ancho de 5 zonas.
 * Devuelve el trazo relleno de la membrana (la unión de todos + filtro de contorno da la
 * línea final).
 */
function connector(theta: number, R: number, v: number, sign: number): string {
  const A: V = [CX, CY];
  const B = ptAt(R, theta) as V;
  const dx = B[0] - A[0], dy = B[1] - A[1];
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  const px = -uy, py = ux;
  const curl = 0.07 * sign * L; // leve sinuosidad orgánica
  const C1: V = [A[0] + ux * L * 0.34 + px * curl, A[1] + uy * L * 0.34 + py * curl];
  const C2: V = [B[0] - ux * L * 0.32 + px * curl, B[1] - uy * L * 0.32 + py * curl];

  // medio-anchos por zona: grande (núcleo) · med · pequeño (cintura) · med · grande (nodo)
  const waist = WAIST_LO + (WAIST_HI - WAIST_LO) * v;
  const big0 = CORE_R; // se funde en el núcleo
  const big4 = NODE_FLARE; // ataca la bola tangencialmente
  const widths = [big0, (big0 + waist) / 2, waist, (waist + big4) / 2, big4];

  const left: V[] = [];
  const right: V[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const P = cubic(A, C1, C2, B, t);
    const d = cubicD(A, C1, C2, B, t);
    const dl = Math.hypot(d[0], d[1]) || 1;
    const nx = -d[1] / dl, ny = d[0] / dl; // normal unitaria
    const h = catmull(widths, t);
    left.push([P[0] + nx * h, P[1] + ny * h]);
    right.push([P[0] - nx * h, P[1] - ny * h]);
  }

  let dstr = `M ${f(left[0][0])} ${f(left[0][1])}`;
  for (let i = 1; i < left.length; i++) dstr += ` L ${f(left[i][0])} ${f(left[i][1])}`;
  for (let i = right.length - 1; i >= 0; i--) dstr += ` L ${f(right[i][0])} ${f(right[i][1])}`;
  return dstr + " Z";
}

export const SensorNetwork = forwardRef<
  SVGSVGElement,
  { profile: SensorProfile; animateIn?: boolean; construction?: boolean }
>(function SensorNetwork({ profile, construction = false }, ref) {
  const axes = RING_ORDER.map((id, i) => {
    const theta = i * STEP;
    const v = readingOf(profile.params[id]);
    const R = radiusOf(v);
    const center = ptAt(R, theta) as V;
    const path = connector(theta, R, v, i % 2 === 0 ? 1 : -1);
    return { id, theta, v, R, center, path };
  });

  const WHITE = "#f2f6ff";
  const GUIDE = "#5f7bb0";
  const inkId = `ink-${profile.id.replace(/\W/g, "")}`;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VB} ${VB}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Símbolo sensorial ${profile.code} · ${profile.site} · ${profile.name}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{`Símbolo sensorial ${profile.code} · ${profile.name}`}</title>

      <defs>
        {/* contorno: erosiona la silueta unida y resta → deja sólo la línea exterior */}
        <filter id={inkId} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feMorphology operator="erode" radius="1.5" in="SourceGraphic" result="eroded" />
          <feComposite operator="out" in="SourceGraphic" in2="eroded" />
        </filter>
      </defs>

      {/* ---------- capa blueprint ---------- */}
      {construction && (
        <g id="blueprint" data-name="blueprint">
          <rect x="0" y="0" width={VB} height={VB} fill="#0d1f47" />
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1b3068" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x="0" y="0" width={VB} height={VB} fill="url(#grid)" />
          <g id="guias" data-name="circulos-guia">
            {GUIDES.map((g, i) => (
              <g key={g}>
                <circle cx={CX} cy={CY} r={g * R_MAX} fill="none" stroke={GUIDE} strokeWidth={0.6} strokeDasharray="2 2" opacity={0.7} />
                <text x={CX + 2} y={CY - g * R_MAX + 3.4} fontSize={5} className="mono" fill={GUIDE} opacity={0.9}>{i + 1}</text>
              </g>
            ))}
          </g>
          <g id="ejes" data-name="ejes-radiales">
            {axes.map(({ id, theta }) => {
              const [ex, ey] = ptAt(R_MAX, theta);
              return <line key={id} x1={CX} y1={CY} x2={f(ex)} y2={f(ey)} stroke={GUIDE} strokeWidth={0.5} strokeDasharray="1.5 2.5" opacity={0.55} />;
            })}
          </g>
          <g id="cotas" data-name="cotas">
            <path d={`M ${f(ptAt(30, 0)[0])} ${f(ptAt(30, 0)[1])} A 30 30 0 0 1 ${f(ptAt(30, STEP)[0])} ${f(ptAt(30, STEP)[1])}`} fill="none" stroke={GUIDE} strokeWidth={0.6} />
            <text x={f(ptAt(37, STEP / 2)[0])} y={f(ptAt(37, STEP / 2)[1])} fontSize={5.2} className="mono" fill={GUIDE} textAnchor="middle">51.43°</text>
            {axes.map(({ id, R, center }) => (
              <text key={`c-${id}`} x={f(center[0])} y={f(center[1]) - NODE_R - 3} fontSize={4.6} className="mono" fill={GUIDE} textAnchor="middle" opacity={0.9}>
                {Math.round((R / R_MAX) * 100)}%
              </text>
            ))}
          </g>
          <text x="6" y="12" fontSize={6} className="mono" fill={GUIDE}>SÍMBOLO SENSORIAL · 7 EJES</text>
          <text x="6" y={VB - 6} fontSize={5} className="mono" fill={GUIDE}>Rᵢ = Rmín + Vᵢ·(Rmáx−Rmín)</text>
          <text x={VB - 6} y={VB - 6} fontSize={5} className="mono" fill={GUIDE} textAnchor="end">{profile.code}</text>
        </g>
      )}

      {/* ---------- símbolo (silueta unida → contorno) ---------- */}
      <g id="simbolo" data-name="simbolo" fill={WHITE} filter={`url(#${inkId})`}>
        <g id="conectores" data-name="conectores-viscosos">
          {axes.map(({ id, path }) => (
            <path key={id} id={`con-${id}`} data-name={`conector-${id}`} d={path} />
          ))}
        </g>
        <circle id="nucleo" data-name="nucleo" cx={CX} cy={CY} r={CORE_R} />
        <g id="nodos" data-name="nodos">
          {axes.map(({ id, center }) => (
            <circle key={id} id={`nodo-${id}`} data-name={`nodo-${id}`} cx={f(center[0])} cy={f(center[1])} r={NODE_R} />
          ))}
        </g>
      </g>
    </svg>
  );
});
