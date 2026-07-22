import { useEffect, useState } from "react";
import type { SensorProfile } from "../../lib/labels/types";
import { CieloSona, EtiquetaSona } from "./EtiquetaSona";

/* ============================================================
   FICHA PÚBLICA — la pantalla que abre el tap en la señalética.
   Apertura: el color del ESTADO a pantalla completa con la palabra
   "sona" al centro del espacio, siempre. Al deslizar hacia arriba,
   la hoja de lectura sube por encima del cielo y descubre toda la
   información. Primero significado, después datos.
   ============================================================ */

export function FichaPublica({ profiles, code }: { profiles: SensorProfile[]; code: string }) {
  const profile = profiles.find((p) => p.code.toLowerCase() === code.toLowerCase());
  const [leyendo, setLeyendo] = useState(false);

  useEffect(() => {
    const onScroll = () => setLeyendo(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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

  return (
    <div className="relative" style={{ background: "#F7F4EE" }}>
      {/* capa fija: el estado a pantalla completa, sona SIEMPRE al centro */}
      <div className="fixed inset-0">
        <CieloSona profile={profile} />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-1 transition-opacity duration-300"
          style={{ opacity: leyendo ? 0 : 1 }}
        >
          <span className="font-mono text-eyebrow uppercase tracking-[0.16em] text-ink-2">
            Desliza para leer el lugar
          </span>
          <svg width="16" height="9" viewBox="0 0 16 9" aria-hidden>
            <path d="M1 8 L8 1 L15 8" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-2" />
          </svg>
        </div>
      </div>

      {/* capa que desliza: un viewport de cielo y después la hoja */}
      <div className="relative">
        <div style={{ height: "100dvh" }} aria-hidden />
        <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-t-2xl" style={{ boxShadow: "0 -18px 44px rgba(31,51,79,.18)" }}>
          <EtiquetaSona key={profile.id} profile={profile} animateIn plena hoja />
        </div>
      </div>
    </div>
  );
}
