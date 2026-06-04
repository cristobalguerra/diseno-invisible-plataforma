import { Frown, Meh, Smile } from "lucide-react";
import { getCategory, CATEGORY_COLOR, SEVERITY_COLOR } from "../../data/catalog";
import type { CategoryId } from "../../lib/types";
import { RING_ORDER, type SensorProfile } from "../../lib/labels/types";
import { globalLoad, intensitySeverity } from "../../lib/labels/profiles";
import { SensorSeal } from "./SensorSeal";

const LOAD_CATS: CategoryId[] = ["sound", "light", "flow", "visual", "wait"];
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Confort emocional 0..1 (1 = en calma): la carga y la confusión tensan; el refugio alivia. */
function comfort(p: SensorProfile): number {
  const load = globalLoad(p);
  const confusion = p.params.orientation.intensity;
  const refuge = p.params.pause.intensity;
  return clamp01(1 - load * 0.9 - confusion * 0.25 + refuge * 0.3);
}

type Band = "calm" | "neutral" | "stress";
const bandOf = (c: number): Band => (c >= 0.6 ? "calm" : c >= 0.38 ? "neutral" : "stress");
const BAND = {
  calm: { label: "En calma", sev: 0 as const, Icon: Smile },
  neutral: { label: "Alerta", sev: 1 as const, Icon: Meh },
  stress: { label: "Tensión", sev: 2 as const, Icon: Frown },
};

/** categorías de carga ordenadas por intensidad (tensores dominantes) */
function stressors(p: SensorProfile, k: number) {
  return [...LOAD_CATS]
    .sort((a, b) => p.params[b].intensity - p.params[a].intensity)
    .slice(0, k)
    .map((c) => ({ id: c, name: getCategory(c).name, v: p.params[c].intensity }));
}

/** recomendación de la etapa: decisión del tensor dominante según su severidad */
function recommendation(p: SensorProfile): string {
  const top = stressors(p, 1)[0];
  return getCategory(top.id).levels[intensitySeverity(top.v)].decision;
}

function groupBySite(profiles: SensorProfile[]): { site: string; spaces: SensorProfile[] }[] {
  const order: string[] = [];
  const map = new Map<string, SensorProfile[]>();
  for (const p of profiles) {
    if (!map.has(p.site)) {
      map.set(p.site, []);
      order.push(p.site);
    }
    map.get(p.site)!.push(p);
  }
  return order.map((site) => ({ site, spaces: map.get(site)! }));
}

const CELL = 156;
const AXIS = 64;
const CH = 158; // alto del área de gráfica
const TOP = 30;
const BOT = 128;
const mapY = (c: number) => TOP + (1 - c) * (BOT - TOP);

/** curva suave (Catmull-Rom → bézier) */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
}

export function JourneyMap({ profiles }: { profiles: SensorProfile[] }) {
  const groups = groupBySite(profiles);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap gap-4">
        {(["calm", "neutral", "stress"] as Band[]).map((b) => {
          const { label, sev, Icon } = BAND[b];
          return (
            <span key={b} className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
              <Icon size={15} style={{ color: SEVERITY_COLOR[sev] }} />
              {label}
            </span>
          );
        })}
      </div>

      {groups.map(({ site, spaces }) => {
        const n = spaces.length;
        const W = n * CELL;
        const pts = spaces.map((p, i) => {
          const c = comfort(p);
          return { p, c, band: bandOf(c), x: i * CELL + CELL / 2, y: mapY(c) };
        });
        const worst = pts.reduce((a, b) => (b.c < a.c ? b : a));
        const best = pts.reduce((a, b) => (b.c > a.c ? b : a));
        const curve = smoothPath(pts);
        const area = n > 1 ? `${curve} L ${pts[n - 1].x},${BOT} L ${pts[0].x},${BOT} Z` : "";
        const gid = `jg-${site.replace(/\W/g, "")}`;

        return (
          <div key={site}>
            <div className="mb-1 flex items-baseline gap-2">
              <h3 className="text-[15px] font-bold tracking-tight text-ink">{site}</h3>
              <span className="font-mono text-[11px] text-ink-3">recorrido emocional · {n} etapas</span>
            </div>
            <p className="mb-4 max-w-[78ch] text-[12px] leading-relaxed text-ink-2">
              Pico de tensión en <span className="font-semibold text-ink">{worst.p.name}</span> (por{" "}
              {getCategory(stressors(worst.p, 1)[0].id).name.toLowerCase()}).
              {n > 1 && (
                <>
                  {" "}
                  Mayor alivio en <span className="font-semibold text-ink">{best.p.name}</span>.
                </>
              )}
            </p>

            <div className="flex rounded-md border border-line bg-paper">
              {/* eje de estados */}
              <div className="relative shrink-0 border-r border-line" style={{ width: AXIS, height: CH }}>
                {(["calm", "neutral", "stress"] as Band[]).map((b) => {
                  const yMid =
                    b === "calm" ? (TOP + mapY(0.6)) / 2 : b === "neutral" ? (mapY(0.6) + mapY(0.38)) / 2 : (mapY(0.38) + BOT) / 2;
                  return (
                    <span
                      key={b}
                      className="absolute right-2 -translate-y-1/2 text-[9px] font-medium uppercase tracking-[0.06em]"
                      style={{ top: yMid, color: SEVERITY_COLOR[BAND[b].sev] }}
                    >
                      {BAND[b].label}
                    </span>
                  );
                })}
              </div>

              <div className="min-w-0 flex-1 overflow-x-auto">
                <div style={{ width: W }}>
                  {/* gráfica */}
                  <div className="relative" style={{ height: CH }}>
                    <svg width={W} height={CH} viewBox={`0 0 ${W} ${CH}`} className="block">
                      <defs>
                        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SEVERITY_COLOR[0]} stopOpacity={0.26} />
                          <stop offset="52%" stopColor={SEVERITY_COLOR[1]} stopOpacity={0.16} />
                          <stop offset="100%" stopColor={SEVERITY_COLOR[2]} stopOpacity={0.24} />
                        </linearGradient>
                      </defs>
                      {/* realces de pico / refugio */}
                      <rect x={worst.x - CELL / 2} y={0} width={CELL} height={CH} fill={SEVERITY_COLOR[2]} opacity={0.06} />
                      {n > 1 && <rect x={best.x - CELL / 2} y={0} width={CELL} height={CH} fill={SEVERITY_COLOR[0]} opacity={0.06} />}
                      {/* líneas de banda */}
                      {[mapY(0.6), mapY(0.38)].map((y, i) => (
                        <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="var(--color-line)" strokeWidth={0.6} strokeDasharray="3 4" />
                      ))}
                      {/* guías verticales */}
                      {pts.map((pt, i) => (
                        <line key={i} x1={pt.x} y1={TOP - 6} x2={pt.x} y2={BOT} stroke="var(--color-line)" strokeWidth={0.5} />
                      ))}
                      {/* relleno + curva */}
                      {n > 1 && <path d={area} fill={`url(#${gid})`} />}
                      {n > 1 && <path d={curve} fill="none" stroke="var(--color-ink)" strokeWidth={2.25} strokeLinecap="round" />}
                      {/* puntos */}
                      {pts.map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y} r={3.5} fill={SEVERITY_COLOR[BAND[pt.band].sev]} />
                      ))}
                    </svg>
                    {/* insignias de emoción */}
                    {pts.map((pt, i) => {
                      const { Icon, sev } = BAND[pt.band];
                      return (
                        <div key={i} className="absolute flex flex-col items-center" style={{ left: pt.x - 18, top: pt.y - 40 }}>
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full border-2"
                            style={{ background: "var(--color-paper)", borderColor: SEVERITY_COLOR[sev] }}
                          >
                            <Icon size={18} style={{ color: SEVERITY_COLOR[sev] }} />
                          </span>
                          <span className="mt-0.5 text-[10px] font-bold" style={{ color: SEVERITY_COLOR[sev] }}>
                            {Math.round(pt.c * 100)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* detalle por etapa */}
                  <div className="grid border-t border-line" style={{ gridTemplateColumns: `repeat(${n}, ${CELL}px)` }}>
                    {pts.map((pt, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 border-l border-line p-3 first:border-l-0">
                        <div className="h-11 w-11">
                          <SensorSeal profile={pt.p} />
                        </div>
                        <div className="w-full text-center">
                          <div className="truncate text-[12px] font-bold text-ink" title={pt.p.name}>{pt.p.name}</div>
                          <div className="font-mono text-[10px] text-ink-3">{pt.p.code}</div>
                        </div>

                        <div className="mt-0.5 w-full">
                          <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-ink-3">Tensores</div>
                          <div className="flex flex-col gap-1">
                            {stressors(pt.p, 3).map((s) => (
                              <div key={s.id} className="flex items-center gap-1.5">
                                <span className="w-[42px] shrink-0 truncate text-[9px] text-ink-2" title={s.name}>{s.name}</span>
                                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                                  <span className="block h-full rounded-full" style={{ width: `${Math.max(6, s.v * 100)}%`, background: CATEGORY_COLOR[s.id] }} />
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <p className="mt-0.5 w-full text-[10px] leading-snug text-ink-2">{recommendation(pt.p)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
