import { useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { getCategory } from "../../data/catalog";
import type { SensorProfile } from "../../lib/labels/types";
import { RING_ORDER } from "../../lib/labels/types";
import { globalLoad, newSpace, siteCode } from "../../lib/labels/profiles";
import { Button, Eyebrow, cx } from "../ui/kit";
import { SensorSeal } from "../labels/SensorSeal";

/** categoría con mayor intensidad (exigencia dominante del espacio) */
function dominant(p: SensorProfile): string {
  let best = RING_ORDER[0];
  for (const c of RING_ORDER) if (p.params[c].intensity > p.params[best].intensity) best = c;
  return getCategory(best).name;
}

/** agrupa los espacios por sitio, conservando el orden de aparición */
function byCite(profiles: SensorProfile[]): { site: string; spaces: SensorProfile[] }[] {
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

export function Espacios({
  profiles,
  onProfilesChange,
  selectedId,
  onOpen,
}: {
  profiles: SensorProfile[];
  onProfilesChange: (p: SensorProfile[]) => void;
  selectedId: string;
  onOpen: (id: string) => void;
}) {
  const [site, setSite] = useState("");
  const [name, setName] = useState("");

  const groups = byCite(profiles);
  const sites = groups.map((g) => g.site);

  function register() {
    const s = site.trim() || "Sin grupo";
    const inSite = profiles.filter((p) => p.site === s).length;
    const code = `${siteCode(s)}-${String(inSite + 1).padStart(2, "0")}`;
    const sp = newSpace(name.trim() || `Espacio ${inSite + 1}`, code, s);
    onProfilesChange([...profiles, sp]);
    setName("");
    onOpen(sp.id); // abre el estudio para capturar los datos medidos
  }

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-7">
        <Eyebrow>01 · Espacios medidos</Eyebrow>
        <h1 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-tight text-ink md:text-[30px]">
          Repositorio de la investigación
        </h1>
        <p className="mt-2 max-w-[64ch] text-[14px] leading-relaxed text-ink-2">
          Los espacios se agrupan por <strong>sitio</strong> (un edificio o recinto) y, dentro, sus
          espacios medidos, cada uno con su <strong>sello sensorial</strong> generado de sus datos.
          La colección crece por grupos conforme avanza la investigación.
        </p>
      </header>

      {/* registrar espacio dentro de un sitio */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4 md:px-8">
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Sitio / edificio</span>
            <input
              list="di-sites"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              placeholder="Museo MARCO…"
              className="w-[200px] rounded-sm border border-line-strong bg-paper px-2.5 py-1.5 text-[13px] text-ink transition-colors duration-150 ease-out focus-visible:border-accent"
            />
            <datalist id="di-sites">
              {sites.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">Espacio</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && register()}
              placeholder="Entrada, sala, pasillo…"
              className="w-[200px] rounded-sm border border-line-strong bg-paper px-2.5 py-1.5 text-[13px] text-ink transition-colors duration-150 ease-out focus-visible:border-accent"
            />
          </label>
          <Button variant="primary" icon={<Plus size={14} />} onClick={register}>
            Registrar y medir
          </Button>
        </div>
        <span className="font-mono text-[11px] text-ink-3">
          {groups.length} sitios · {profiles.length} espacios
        </span>
      </div>

      {/* grupos */}
      <div className="flex flex-col">
        {groups.map(({ site: s, spaces }) => (
          <section key={s} className="border-b border-line px-5 py-6 last:border-b-0 md:px-8">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-[16px] font-bold tracking-tight text-ink">{s}</h2>
              <span className="font-mono text-[11px] text-ink-3">{spaces.length} espacios</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {spaces.map((p) => {
                const active = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onOpen(p.id)}
                    className={cx(
                      "group flex flex-col gap-2 rounded-md border bg-paper p-4 text-left transition duration-200 ease-out hover:border-line-strong active:scale-[0.99]",
                      active ? "border-ink" : "border-line",
                    )}
                  >
                    <div className="mx-auto h-[120px] w-[120px]">
                      <SensorSeal profile={p} />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-[10px] text-ink-3">{p.code}</span>
                      <ArrowUpRight size={13} className="text-ink-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                    </div>
                    <div className="truncate text-[13px] font-semibold text-ink">{p.name}</div>
                    <div className="text-[11px] leading-snug text-ink-2">
                      Carga {Math.round(globalLoad(p) * 100)}% · {dominant(p)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
