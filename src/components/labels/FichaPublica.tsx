import type { SensorProfile } from "../../lib/labels/types";
import { EtiquetaSona } from "./EtiquetaSona";

/* ============================================================
   FICHA PÚBLICA — la pantalla que abre el tap en la señalética.
   Un visitante llega por NFC o QR con la liga #/e/CODIGO y ve la
   etiqueta completa del espacio, nada más: sin shell, sin panel,
   sin navegación. Primero significado, después datos.
   ============================================================ */

export function FichaPublica({ profiles, code }: { profiles: SensorProfile[]; code: string }) {
  const profile = profiles.find((p) => p.code.toLowerCase() === code.toLowerCase());

  return (
    <div className="flex min-h-dvh flex-col items-center bg-canvas px-4 py-6">
      <div className="w-full max-w-[430px]">
        {profile ? (
          <>
            <EtiquetaSona key={profile.id} profile={profile} animateIn />
            <p className="mt-4 text-center font-mono text-micro uppercase tracking-[0.14em] text-ink-3">
              SONA · Lectura anticipatoria del lugar
            </p>
          </>
        ) : (
          <div className="rounded-md border border-line bg-paper p-6 text-center">
            <div className="text-strong font-semibold text-ink">Etiqueta no encontrada</div>
            <p className="mt-2 text-body leading-relaxed text-ink-2">
              La liga <span className="font-mono">{code}</span> no corresponde a ningún espacio
              registrado. Verifica la señalética o consulta al administrador del sitio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
