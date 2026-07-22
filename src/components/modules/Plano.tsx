import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Download, RotateCcw, RotateCw, Shuffle } from "lucide-react";
import type { CategoryId } from "../../lib/types";
import { CATEGORY_COLOR, getCategory } from "../../data/catalog";
import { RING_ORDER, type SensorProfile } from "../../lib/labels/types";
import type { Plano, PlanoMap, PlanoRoom } from "../../lib/plano/types";
import { reconcilePlano, roomsMatchSpaces } from "../../lib/plano/sync";
import { autoLayout } from "../../lib/plano/layout";
import { downloadPng, downloadSvg } from "../../lib/export";
import { Button, Eyebrow, cx } from "../ui/kit";
import { PlanoCanvas } from "../plano/PlanoCanvas";
import { PlanoSvg } from "../plano/PlanoSvg";
import { planoFileName } from "../plano/regions";

/** lista de sitios en orden de aparición */
function sitesOf(profiles: SensorProfile[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of profiles) if (!seen.has(p.site)) { seen.add(p.site); out.push(p.site); }
  return out;
}

const MAX_CHIPS = 4;

export function Plano({
  profiles,
  planos,
  onPlanosChange,
  selectedId,
  onSelectId,
}: {
  profiles: SensorProfile[];
  planos: PlanoMap;
  onPlanosChange: Dispatch<SetStateAction<PlanoMap>>;
  selectedId: string;
  onSelectId: (id: string) => void;
}) {
  const sites = sitesOf(profiles);
  const initialSite = profiles.find((p) => p.id === selectedId)?.site ?? sites[0] ?? "";
  const [activeSite, setActiveSite] = useState(initialSite);
  const [selRoom, setSelRoom] = useState<string>(selectedId);
  const lamRef = useRef<SVGSVGElement>(null);

  const spacesOfSite = useMemo(() => profiles.filter((p) => p.site === activeSite), [profiles, activeSite]);
  const spaceIds = spacesOfSite.map((p) => p.id).join("|");
  const byId = useMemo(() => new Map(spacesOfSite.map((p) => [p.id, p])), [spacesOfSite]);

  // plano de trabajo: el guardado, o uno reconciliado al vuelo si aún no existe
  const plano: Plano = planos[activeSite] ?? reconcilePlano(activeSite, spacesOfSite, planos[activeSite]);

  // al abrir un sitio (o cambiar sus espacios), siembra/reconcilia su plano una vez
  useEffect(() => {
    onPlanosChange((prev) => {
      const cur = prev[activeSite];
      if (cur && roomsMatchSpaces(cur, spacesOfSite)) return prev;
      return { ...prev, [activeSite]: reconcilePlano(activeSite, spacesOfSite, cur) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSite, spaceIds]);

  function mutate(fn: (p: Plano) => Plano) {
    onPlanosChange((prev) => {
      const cur = prev[activeSite] ?? reconcilePlano(activeSite, spacesOfSite, prev[activeSite]);
      return { ...prev, [activeSite]: fn(cur) };
    });
  }

  const selectedRoom: PlanoRoom | undefined =
    plano.rooms.find((r) => r.profileId === selRoom) ?? plano.rooms[0];
  const selProfile = selectedRoom ? byId.get(selectedRoom.profileId) : undefined;

  function setRooms(rooms: PlanoRoom[]) {
    mutate((p) => ({ ...p, rooms }));
  }
  function toggleChip(cat: CategoryId) {
    if (!selectedRoom) return;
    mutate((p) => ({
      ...p,
      rooms: p.rooms.map((r) => {
        if (r.profileId !== selectedRoom.profileId) return r;
        const has = r.chips.includes(cat);
        if (has) return { ...r, chips: r.chips.filter((c) => c !== cat) };
        if (r.chips.length >= MAX_CHIPS) return r;
        return { ...r, chips: RING_ORDER.filter((c) => r.chips.includes(c) || c === cat) };
      }),
    }));
  }
  function rotateRoom(delta: number) {
    if (!selectedRoom) return;
    mutate((p) => ({
      ...p,
      rooms: p.rooms.map((r) =>
        r.profileId === selectedRoom.profileId ? { ...r, rot: (((r.rot ?? 0) + delta) % 360 + 360) % 360 } : r,
      ),
    }));
  }
  function autoOrganize() {
    mutate((p) => {
      const { rooms, entrance } = autoLayout(spacesOfSite);
      return { ...p, rooms, entrance };
    });
  }

  const fname = planoFileName(activeSite);
  const empty = spacesOfSite.length === 0;

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-7">
        <Eyebrow>04 · Blueprint sensorial</Eyebrow>
        <h1 className="mt-2 text-display font-bold leading-[1.1] tracking-tight text-ink md:text-display-lg">
          Plano del sitio
        </h1>
        <p className="mt-2 max-w-[68ch] text-strong leading-relaxed text-ink-2">
          Acomoda los espacios medidos del sitio como un plano abstracto: el sistema parte de un
          <strong> auto-acomodo</strong> y tú lo ajustas (mover, redimensionar, rotar). Eliges qué
          <strong> chips sensoriales</strong> muestra cada sala y exportas la <strong>lámina</strong>.
        </p>
      </header>

      {/* barra de control */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line px-5 py-4 md:px-8">
        <label className="flex flex-col gap-1">
          <span className="text-micro font-semibold uppercase tracking-[0.08em] text-ink-3">Sitio</span>
          <select
            value={activeSite}
            onChange={(e) => setActiveSite(e.target.value)}
            className="min-w-[200px] rounded-sm border border-line-strong bg-paper px-2.5 py-1.5 text-body text-ink transition-colors duration-150 ease-out focus-visible:border-accent"
          >
            {sites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <Button icon={<Shuffle size={14} />} onClick={autoOrganize} disabled={empty}>Auto-organizar</Button>
          <Button icon={<Download size={14} />} onClick={() => lamRef.current && downloadSvg(lamRef.current, fname)} disabled={empty}>SVG</Button>
          <Button icon={<Download size={14} />} onClick={() => lamRef.current && downloadPng(lamRef.current, fname)} disabled={empty}>PNG</Button>
        </div>
      </div>

      {empty ? (
        <div className="px-5 py-16 text-center text-body text-ink-3 md:px-8">
          Este sitio aún no tiene espacios medidos. Registra y mide espacios en{" "}
          <span className="font-mono text-ink-2">01 · Espacios</span> y{" "}
          <span className="font-mono text-ink-2">03 · Medición</span>.
        </div>
      ) : (
        <>
          {/* editor + inspector */}
          <div className="grid grid-cols-1 gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
            <section className="flex flex-col gap-2">
              <span className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-3">
                Disposición — arrastra para mover, esquina para redimensionar
              </span>
              <div className="overflow-hidden rounded-md border border-line bg-canvas" style={{ aspectRatio: "1000 / 640" }}>
                <PlanoCanvas
                  plano={plano}
                  byId={byId}
                  selectedId={selectedRoom?.profileId ?? null}
                  onSelect={(id) => { setSelRoom(id); if (id) onSelectId(id); }}
                  onRooms={setRooms}
                />
              </div>
            </section>

            <aside className="flex flex-col gap-4 rounded-md border border-line bg-paper p-5">
              {selectedRoom && selProfile ? (
                <>
                  <div>
                    <div className="font-mono text-eyebrow text-ink-3">{selProfile.code}</div>
                    <div className="text-strong font-semibold text-ink">{selProfile.name}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-ink-3">
                      Chips de la sala ({selectedRoom.chips.length}/{MAX_CHIPS})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {RING_ORDER.map((id) => {
                        const on = selectedRoom.chips.includes(id);
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => toggleChip(id)}
                            aria-pressed={on}
                            className={cx(
                              "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-eyebrow font-medium transition duration-150 ease-out active:scale-[0.97]",
                              on ? "border-ink bg-ink text-canvas" : "border-line-strong text-ink-2 hover:border-ink hover:text-ink",
                            )}
                          >
                            <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLOR[id] }} aria-hidden />
                            {getCategory(id).code}
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-eyebrow leading-snug text-ink-3">
                      El nivel del chip ({"Bajo/Medio/Alto"}) se deriva de la intensidad medida del espacio.
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-line pt-3">
                    <span className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-ink-3">Rotar</span>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" icon={<RotateCcw size={14} />} onClick={() => rotateRoom(-15)}>15°</Button>
                      <span className="tnum font-mono text-caption text-ink-3">{selectedRoom.rot ?? 0}°</span>
                      <Button variant="ghost" icon={<RotateCw size={14} />} onClick={() => rotateRoom(15)}>15°</Button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-body text-ink-3">Selecciona una sala en el plano para editar sus chips.</p>
              )}

              <div className="flex flex-col gap-2 border-t border-line pt-3">
                <label className="flex flex-col gap-1">
                  <span className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-ink-3">Título de la lámina</span>
                  <input
                    value={plano.title}
                    onChange={(e) => mutate((p) => ({ ...p, title: e.target.value }))}
                    className="rounded-sm border border-line-strong bg-paper px-2.5 py-1.5 text-body text-ink focus-visible:border-accent"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-ink-3">Escala</span>
                  <input
                    value={plano.scale}
                    onChange={(e) => mutate((p) => ({ ...p, scale: e.target.value }))}
                    className="rounded-sm border border-line-strong bg-paper px-2.5 py-1.5 text-body text-ink focus-visible:border-accent"
                  />
                </label>
              </div>
            </aside>
          </div>

          {/* lámina exportable */}
          <section className="border-t border-line px-5 py-6 md:px-8">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-eyebrow font-semibold uppercase tracking-[0.08em] text-ink-3">Lámina · vista previa</span>
              <span className="font-mono text-eyebrow text-ink-3">{spacesOfSite.length} espacios</span>
            </div>
            <div className="overflow-hidden rounded-md border border-line" style={{ aspectRatio: "1600 / 900" }}>
              <PlanoSvg ref={lamRef} plano={plano} profiles={spacesOfSite} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
