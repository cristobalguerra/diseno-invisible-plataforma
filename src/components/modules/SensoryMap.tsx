import { useRef } from "react";
import { Download } from "lucide-react";
import type { Zone } from "../../lib/types";
import { getCategory, SEVERITY_COLOR } from "../../data/catalog";
import { computePriority, PRIORITY_SEVERITY } from "../../lib/priority";
import { downloadPng, downloadSvg } from "../../lib/export";
import { Button, Eyebrow, cx } from "../ui/kit";
import { MapaSensorial } from "../map/MapaSensorial";

const PRI_LABEL = { alta: "Alta", media: "Media", baja: "Baja" } as const;

export function SensoryMap({ zones }: { zones: Zone[] }) {
  const mapRef = useRef<SVGSVGElement>(null);

  const rows = zones.map((z) => ({ z, p: computePriority(z.levels) }));
  const counts = rows.reduce(
    (acc, { p }) => ({ ...acc, [p.level]: acc[p.level] + 1 }),
    { alta: 0, media: 0, baja: 0 } as Record<"alta" | "media" | "baja", number>,
  );

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-7">
        <Eyebrow>04 · Mapa sensorial</Eyebrow>
        <h1 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-tight text-ink md:text-[30px]">
          Perfil del recorrido
        </h1>
        <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-ink-2">
          Lectura de extremo a extremo del recorrido: dónde sube la carga sensorial, qué zonas
          son críticas y la huella de cada punto. Edita las zonas en Señalética; este mapa se
          recalcula al instante.
        </p>
      </header>

      <div className="flex flex-col gap-6 p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2.5">
          {(["alta", "media", "baja"] as const).map((lv) => (
            <span key={lv} className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 text-[12px] text-ink-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_COLOR[PRIORITY_SEVERITY[lv]] }} aria-hidden />
              <span className="tnum font-medium text-ink">{counts[lv]}</span>
              {PRI_LABEL[lv].toLowerCase()}
            </span>
          ))}
        </div>

        <section>
          <div className="overflow-x-auto rounded-md border border-line bg-sunken p-4">
            <MapaSensorial ref={mapRef} zones={zones} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button icon={<Download size={14} />} onClick={() => mapRef.current && downloadSvg(mapRef.current, "mapa-sensorial")}>
              SVG
            </Button>
            <Button icon={<Download size={14} />} onClick={() => mapRef.current && downloadPng(mapRef.current, "mapa-sensorial")}>
              PNG
            </Button>
          </div>
        </section>

        {/* tabla resumen */}
        <section className="overflow-hidden rounded-md border border-line">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-paper text-[10px] uppercase tracking-[0.08em] text-ink-3">
                <th className="px-4 py-2.5 font-semibold">Zona</th>
                <th className="px-4 py-2.5 font-semibold">Prioridad</th>
                <th className="px-4 py-2.5 font-semibold">Carga</th>
                <th className="hidden px-4 py-2.5 font-semibold sm:table-cell">Altas</th>
                <th className="hidden px-4 py-2.5 font-semibold md:table-cell">Orientación</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ z, p }) => {
                const priColor = SEVERITY_COLOR[PRIORITY_SEVERITY[p.level]];
                return (
                  <tr key={z.id} className="border-b border-line last:border-b-0 bg-paper">
                    <td className="px-4 py-3">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[11px] text-ink-3">{z.code}</span>
                        <span className="text-[13px] font-medium text-ink">{z.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-[13px] text-ink-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: priColor }} aria-hidden />
                        {PRI_LABEL[p.level]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-sunken">
                          <span className="block h-full rounded-full" style={{ width: `${(p.loadScore / 10) * 100}%`, background: priColor }} />
                        </span>
                        <span className="tnum font-mono text-[11px] text-ink-3">{p.loadScore}/10</span>
                      </div>
                    </td>
                    <td className={cx("hidden px-4 py-3 sm:table-cell tnum text-[13px]", p.highCount > 0 ? "font-semibold text-ink" : "text-ink-3")}>
                      {p.highCount}
                    </td>
                    <td className="hidden px-4 py-3 text-[13px] text-ink-2 md:table-cell">
                      {getCategory("orientation").levels[z.levels.orientation].short}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
