import { useMemo, useRef, useState, type ReactNode } from "react";
import { Camera, Check, Info, Mic, Square, Sun, Volume2 } from "lucide-react";
import type { CategoryId, Severity, Zone } from "../../lib/types";
import { getCategory, SEVERITY_COLOR } from "../../data/catalog";
import { useSensors } from "../../lib/useSensors";
import { Button, Eyebrow, cx } from "../ui/kit";
import { LevelMeter } from "../pictogram/LevelMeter";

/* Umbrales de calibración: mapean la lectura normalizada (0..1) a severidad.
   Heurísticos — ajústalos contra un sonómetro / luxómetro de referencia. */
function brightnessToSeverity(b: number): Severity {
  if (b < 0.35) return 0; // luz tenue
  if (b < 0.62) return 1; // luz media
  return 2; // luz intensa
}
function loudnessToSeverity(l: number): Severity {
  if (l < 0.12) return 0; // entorno silencioso
  if (l < 0.32) return 1; // ruido moderado
  return 2; // ruido alto
}

export function Medicion({
  zones,
  onZonesChange,
}: {
  zones: Zone[];
  onZonesChange: (z: Zone[]) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { status, error, readings, audioInputs, audioDeviceId, start, stop, setAudioDevice } =
    useSensors(videoRef);

  const active = status === "active";
  const soundSev = useMemo(() => loudnessToSeverity(readings.loudness), [readings.loudness]);
  const lightSev = useMemo(() => brightnessToSeverity(readings.brightness), [readings.brightness]);

  const [targetZoneId, setTargetZoneId] = useState(zones[0]?.id ?? "");
  const [applied, setApplied] = useState<string | null>(null);

  function applyToZone() {
    const z = zones.find((x) => x.id === targetZoneId) ?? zones[0];
    if (!z) return;
    onZonesChange(
      zones.map((x) =>
        x.id === z.id ? { ...x, levels: { ...x.levels, sound: soundSev, light: lightSev } } : x,
      ),
    );
    setApplied(z.name);
    window.setTimeout(() => setApplied(null), 2800);
  }

  return (
    <div className="flex flex-col">
      <header className="border-b border-line px-5 py-6 md:px-8 md:py-7">
        <Eyebrow>03 · Medición</Eyebrow>
        <h1 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-tight text-ink md:text-[30px]">
          Medir la zona con sensores
        </h1>
        <p className="mt-2 max-w-[62ch] text-[14px] leading-relaxed text-ink-2">
          La cámara estima la intensidad de luz y el micrófono (por ejemplo un Rode) mide el
          nivel de sonido, en vivo. El sistema sugiere la severidad de <em>Luz</em> y{" "}
          <em>Sonido</em>, y puedes volcarla a cualquier zona del recorrido.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 p-5 md:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        {/* cámara */}
        <section className="flex flex-col">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              Cámara
            </span>
            <span className="font-mono text-[11px] text-ink-3">
              {active ? "en vivo" : "inactiva"}
            </span>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-line bg-ink">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={cx(
                "h-full w-full object-cover transition-opacity duration-200 ease-out",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-sunken px-6 text-center">
                {status === "error" ? (
                  <>
                    <span className="flex items-center gap-2 text-[13px] font-medium text-high">
                      <Info size={16} />
                      No se pudo iniciar
                    </span>
                    <p className="max-w-[42ch] text-[13px] leading-relaxed text-ink-2">{error}</p>
                    <Button variant="primary" icon={<Camera size={15} />} onClick={start}>
                      Reintentar
                    </Button>
                  </>
                ) : (
                  <>
                    <Camera size={26} className="text-ink-3" strokeWidth={1.75} />
                    <p className="max-w-[40ch] text-[13px] leading-relaxed text-ink-2">
                      El navegador pedirá permiso para usar tu cámara y micrófono. Todo se procesa
                      aquí mismo: nada se graba ni se envía.
                    </p>
                    <Button
                      variant="primary"
                      icon={<Camera size={15} />}
                      onClick={start}
                      disabled={status === "starting"}
                    >
                      {status === "starting" ? "Iniciando…" : "Activar cámara y micrófono"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          {active && (
            <div className="mt-3 flex items-center justify-between">
              <Button variant="outline" icon={<Square size={13} />} onClick={stop}>
                Detener
              </Button>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-ink-3">
                <span className="h-2 w-2 animate-pulse rounded-full bg-high" aria-hidden />
                grabando lecturas (local)
              </span>
            </div>
          )}
        </section>

        {/* lecturas */}
        <section className="flex flex-col gap-4">
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            Lecturas en vivo
          </span>

          <ReadingCard
            icon={<Volume2 size={15} className="text-ink-2" />}
            categoryId="sound"
            value={readings.loudness}
            sev={soundSev}
            active={active}
            readout="nivel rel."
          />
          <ReadingCard
            icon={<Sun size={15} className="text-ink-2" />}
            categoryId="light"
            value={readings.brightness}
            sev={lightSev}
            active={active}
            readout="brillo"
          />

          {/* selector de micrófono (elige tu Rode) */}
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              <Mic size={12} />
              Entrada de audio
            </span>
            <select
              value={audioDeviceId ?? ""}
              disabled={!active || audioInputs.length === 0}
              onChange={(e) => setAudioDevice(e.target.value)}
              className="w-full rounded-sm border border-line-strong bg-paper px-2.5 py-1.5 text-[13px] text-ink transition-colors duration-150 ease-out focus-visible:border-accent disabled:opacity-50"
            >
              {audioInputs.length === 0 ? (
                <option value="">{active ? "Sin entradas" : "Activa para listar micrófonos"}</option>
              ) : (
                audioInputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))
              )}
            </select>
          </label>

          {/* volcar a zona */}
          <div className="mt-1 flex flex-col gap-2.5 rounded-md border border-line bg-paper p-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              Aplicar a una zona
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={targetZoneId}
                onChange={(e) => setTargetZoneId(e.target.value)}
                className="min-w-0 flex-1 rounded-sm border border-line-strong bg-paper px-2.5 py-1.5 text-[13px] text-ink transition-colors duration-150 ease-out focus-visible:border-accent"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.code} · {z.name}
                  </option>
                ))}
              </select>
              <Button variant="primary" onClick={applyToZone} disabled={!active}>
                Aplicar Sonido y Luz
              </Button>
            </div>
            {applied ? (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-low">
                <Check size={14} />
                Aplicado a {applied}: Sonido {getCategory("sound").levels[soundSev].short}, Luz{" "}
                {getCategory("light").levels[lightSev].short}.
              </span>
            ) : (
              <span className="text-[12px] leading-snug text-ink-3">
                Escribe la severidad medida en <em>Sonido</em> y <em>Luz</em> de la zona elegida.
                Las demás categorías no se tocan.
              </span>
            )}
          </div>
        </section>
      </div>

      <footer className="flex items-start gap-2 border-t border-line px-5 py-4 text-[12px] leading-relaxed text-ink-3 md:px-8">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Lecturas relativas, no calibradas a dB(A) ni lux. Sirven para clasificar Bajo/Medio/Alto;
          para difusión, contrasta con un sonómetro o luxómetro y ajusta los umbrales en{" "}
          <span className="font-mono text-ink-2">Medicion.tsx</span>.
        </span>
      </footer>
    </div>
  );
}

function ReadingCard({
  icon,
  categoryId,
  value,
  sev,
  active,
  readout,
}: {
  icon: ReactNode;
  categoryId: CategoryId;
  value: number;
  sev: Severity;
  active: boolean;
  readout: string;
}) {
  const cat = getCategory(categoryId);
  const level = cat.levels[sev];
  const pct = Math.round(value * 100);
  const color = SEVERITY_COLOR[sev];

  return (
    <div className="rounded-md border border-line bg-paper p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          {icon}
          {cat.name}
        </span>
        <LevelMeter sev={sev} colorMode={active ? "color" : "mono"} height={15} barWidth={5} gap={3} />
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sunken">
        <div
          className="h-full origin-left rounded-full"
          style={{
            background: active ? color : "var(--color-line-strong)",
            transform: `scaleX(${Math.max(0.015, value)})`,
            transition: "transform 70ms linear",
          }}
        />
      </div>

      <div className="mt-2.5 flex items-baseline justify-between">
        <span className={cx("text-[15px] font-semibold", active ? "text-ink" : "text-ink-3")}>
          {active ? level.short : "—"}
        </span>
        <span className="tnum font-mono text-[12px] text-ink-3">
          {active ? `${pct}% · ${readout}` : readout}
        </span>
      </div>
      <p className="mt-1 text-[12px] leading-snug text-ink-2">{active ? level.decision : "Activa los sensores para medir."}</p>
    </div>
  );
}
