import { Fragment } from "react";
import { CATEGORY_COLOR, getCategory } from "../../data/catalog";
import { RING_ORDER, type SensorProfile } from "../../lib/labels/types";
import { globalLoad } from "../../lib/labels/profiles";
import { SensorSeal } from "./SensorSeal";

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

/**
 * RECORRIDO SENSORIAL: la experiencia de extremo a extremo de todo lo medido.
 * Matriz categoría × espacio (por sitio): cada fila muestra cómo evoluciona una
 * categoría a lo largo del recorrido. Profundiza el análisis más allá de un sello.
 */
export function Recorrido({ profiles }: { profiles: SensorProfile[] }) {
  const groups = groupBySite(profiles);

  return (
    <div className="flex flex-col gap-9">
      {groups.map(({ site, spaces }) => {
        const cols = `140px repeat(${spaces.length}, minmax(74px, 1fr))`;
        return (
          <div key={site} className="overflow-x-auto">
            <div className="mb-3 flex items-baseline gap-2">
              <h3 className="text-[14px] font-bold tracking-tight text-ink">{site}</h3>
              <span className="font-mono text-[11px] text-ink-3">{spaces.length} espacios · recorrido</span>
            </div>
            <div className="grid min-w-[480px] items-stretch gap-x-2" style={{ gridTemplateColumns: cols }}>
              {/* encabezado: sello + nombre por espacio */}
              <div />
              {spaces.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-1 pb-2">
                  <div className="h-[44px] w-[44px]">
                    <SensorSeal profile={p} />
                  </div>
                  <div className="w-full truncate text-center text-[10px] font-medium text-ink" title={p.name}>
                    {p.name}
                  </div>
                </div>
              ))}

              {/* una fila por categoría */}
              {RING_ORDER.map((cat) => (
                <Fragment key={cat}>
                  <div className="flex items-center gap-1.5 border-t border-line py-2 text-[12px] text-ink-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: CATEGORY_COLOR[cat] }} aria-hidden />
                    {getCategory(cat).name}
                  </div>
                  {spaces.map((p) => {
                    const v = p.params[cat].intensity;
                    return (
                      <div key={p.id} className="flex items-center border-t border-line px-1" title={`${Math.round(v * 100)}%`}>
                        <span className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                          <span className="block h-full rounded-full" style={{ width: `${Math.max(4, v * 100)}%`, background: CATEGORY_COLOR[cat] }} />
                        </span>
                      </div>
                    );
                  })}
                </Fragment>
              ))}

              {/* carga general por espacio */}
              <div className="flex items-center border-t border-line py-2 text-[12px] font-semibold text-ink">Carga</div>
              {spaces.map((p) => {
                const l = globalLoad(p);
                return (
                  <div key={p.id} className="flex items-center border-t border-line px-1" title={`${Math.round(l * 100)}%`}>
                    <span className="h-1.5 w-full overflow-hidden rounded-full bg-sunken">
                      <span className="block h-full rounded-full" style={{ width: `${Math.max(4, l * 100)}%`, background: "var(--color-ink)" }} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
