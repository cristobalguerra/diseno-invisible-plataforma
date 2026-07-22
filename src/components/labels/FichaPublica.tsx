import { useEffect, useRef, useState } from "react";
import { RING_ORDER } from "../../lib/labels/types";
import type { SensorProfile } from "../../lib/labels/types";
import { CieloSona, DimensionSona, EtiquetaSona, PalabraSona, tonoProfundo } from "./EtiquetaSona";

/* ============================================================
   FICHA PÚBLICA — la pantalla que abre el tap en la señalética.
   DOS estados, sin alturas intermedias:
   · SIN etiqueta — el color del estado a pantalla completa, sona
     al centro con el nombre del estado debajo.
   · CON etiqueta — la hoja entra COMPLETA, anclada al borde
     inferior: termina exactamente donde termina la pantalla.
     Sona ocupa el espacio que queda arriba, centrado, sin el
     nombre del estado (la hoja ya lo dice).
   Deslizar hacia arriba despliega; deslizar hacia abajo repliega.
   ============================================================ */

const CABEZAL_MIN = 190; /* aire mínimo reservado a sona arriba */
const HOJA_W = 700, HOJA_H = 920; /* proporción del arte de la hoja */

export function FichaPublica({ profiles, code }: { profiles: SensorProfile[]; code: string }) {
  const profile = profiles.find((p) => p.code.toLowerCase() === code.toLowerCase());
  const [leyendo, setLeyendo] = useState(false);
  const [slide, setSlide] = useState(0);
  const carrusel = useRef<HTMLDivElement>(null);
  const toqueY = useRef<number | null>(null);
  const toqueX = useRef<number | null>(null);
  const [caja, setCaja] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const medir = () => setCaja([window.innerWidth, window.innerHeight]);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  if (!profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-6">
        <div className="max-w-[420px] rounded-md border border-line bg-paper p-6 text-center">
          <div className="text-strong font-semibold text-ink">Etiqueta no encontrada</div>
          <p className="mt-2 text-body leading-relaxed text-ink-2">
            La liga <span className="font-mono">{code}</span> no corresponde a ningún espacio
            registrado. Verifica la señalética o consulta al administrador del sitio.
          </p>
        </div>
      </div>
    );
  }

  const [vw, vh] = caja;
  /* la hoja entra completa y su borde inferior coincide EXACTO con el
     borde inferior de la pantalla; el cabezal es el espacio restante */
  const anchoHoja = Math.max(1, Math.min(vw, 560, ((vh - CABEZAL_MIN) * HOJA_W) / HOJA_H));
  const altoHoja = (anchoHoja * HOJA_H) / HOJA_W;
  const cabezal = Math.max(CABEZAL_MIN, vh - altoHoja);
  const viaje = vh ? -(vh / 2 - cabezal / 2) : 0;
  const transicion = "transform 560ms cubic-bezier(0.3, 0.7, 0.2, 1)";

  const tono = tonoProfundo(profile);
  const abrir = () => setLeyendo(true);
  const cerrar = () => setLeyendo(false);

  function rueda(e: React.WheelEvent) {
    if (!leyendo && e.deltaY > 8) abrir();
    if (leyendo && e.deltaY < -8) cerrar();
  }
  function toqueInicio(e: React.TouchEvent) {
    toqueY.current = e.touches[0].clientY;
    toqueX.current = e.touches[0].clientX;
  }
  function toqueMueve(e: React.TouchEvent) {
    if (toqueY.current == null || toqueX.current == null) return;
    const d = e.touches[0].clientY - toqueY.current;
    const dx = e.touches[0].clientX - toqueX.current;
    /* el gesto vertical solo manda si domina sobre el horizontal
       (el carrusel de dimensiones usa el eje X) */
    if (!leyendo && d < -34 && Math.abs(d) > Math.abs(dx) * 1.5) { abrir(); toqueY.current = null; }
    if (leyendo && d > 46 && Math.abs(d) > Math.abs(dx) * 1.5) { cerrar(); toqueY.current = null; }
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#F7F4EE" }}
      onWheel={rueda}
      onTouchStart={toqueInicio}
      onTouchMove={toqueMueve}
      onClick={() => { if (!leyendo) abrir(); }}
    >
      {/* cielo del estado */}
      <div className="absolute inset-0">
        <CieloSona profile={profile} />
      </div>

      {/* sona: centro de la pantalla ↔ centro del cabezal */}
      <div
        className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
        style={{ transform: `translateY(${leyendo ? viaje.toFixed(1) : 0}px)`, transition: transicion }}
      >
        <PalabraSona profile={profile} estadoVisible={!leyendo} />
      </div>

      {/* invitación silenciosa: solo la flecha */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-9 z-30 flex justify-center transition-opacity duration-300"
        style={{ opacity: leyendo ? 0 : 1 }}
      >
        <svg width="18" height="10" viewBox="0 0 18 10" aria-hidden>
          <path d="M1 9 L9 1 L17 9" fill="none" stroke={tono} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* la hoja fija; SOLO la caja de dimensiones es slider */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 flex justify-center"
        style={{ transform: leyendo ? "translateY(0)" : "translateY(104%)", transition: transicion }}
        onClick={(e) => { if (leyendo) e.stopPropagation(); }}
      >
        <div className="overflow-hidden rounded-t-2xl" style={{ width: anchoHoja, height: altoHoja }}>
          {/* franja fija superior: estado + interpretación + carga */}
          <EtiquetaSona key={`a-${profile.id}`} profile={profile} plena recorte="0 400 700 352" />
          {/* caja deslizable: lista de dimensiones ↔ detalle por dimensión */}
          <div className="relative">
            <div
              ref={carrusel}
              className="flex snap-x snap-mandatory overflow-x-auto"
              style={{ scrollbarWidth: "none" }}
              onScroll={(e) => {
                const el = e.currentTarget;
                setSlide(Math.round(el.scrollLeft / el.clientWidth));
              }}
            >
              <div className="w-full shrink-0 snap-center">
                <EtiquetaSona key={`d-${profile.id}`} profile={profile} plena recorte="0 752 700 318" />
              </div>
              {RING_ORDER.map((id) => (
                <div key={id} className="w-full shrink-0 snap-center">
                  <DimensionSona profile={profile} id={id} />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center gap-1.5">
              {Array.from({ length: 8 }, (_, i) => (
                <span
                  key={i}
                  className="h-1 w-1 rounded-full"
                  style={{ background: "#1F334F", opacity: i === slide ? 0.5 : 0.14, transition: "opacity 200ms ease" }}
                />
              ))}
            </div>
          </div>
          {/* franja fija inferior: qué puedo hacer + firma */}
          <EtiquetaSona key={`b-${profile.id}`} profile={profile} plena recorte="0 1070 700 250" />
        </div>
      </div>
    </div>
  );
}
