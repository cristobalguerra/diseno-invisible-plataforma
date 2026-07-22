import { forwardRef } from "react";
import type { SensorProfile } from "../../lib/labels/types";
import { globalLoad } from "../../lib/labels/profiles";
import type { Plano } from "../../lib/plano/types";
import {
  TitleBlock,
  PlanoBody,
  LegendSensorial,
  AccionesClave,
  SelloBlock,
  MultilayerStack,
  NorthScale,
  NotaMetodologica,
} from "./regions";

const VBW = 1600;
const VBH = 900;

/**
 * LÁMINA "Blueprint sensorial": un solo `<svg>` raíz (forwardRef) que compone las
 * regiones —título, leyenda, acciones, plano, sello, mapa multicapa, norte/escala y
 * nota— en unidades de viewBox. Al ser un `<svg>` único con color vía var(--color-…),
 * lib/export.ts lo serializa autónomo a SVG/PNG (inyecta CSS vars + fuentes).
 */
export const PlanoSvg = forwardRef<SVGSVGElement, { plano: Plano; profiles: SensorProfile[] }>(function PlanoSvg(
  { plano, profiles },
  ref,
) {
  const byId = new Map(profiles.map((p) => [p.id, p]));
  // perfil "héroe" para el sello del recinto: el espacio de mayor carga.
  const hero = profiles.length ? [...profiles].sort((a, b) => globalLoad(b) - globalLoad(a))[0] : undefined;

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VBW} ${VBH}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Blueprint sensorial · ${plano.site}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{`Blueprint sensorial · ${plano.title}`}</title>
      <defs>
        <pattern id="bpgrid" width={26} height={26} patternUnits="userSpaceOnUse">
          <path d="M26 0 H0 V26" fill="none" stroke="var(--color-line)" strokeWidth={0.6} opacity={0.55} />
        </pattern>
      </defs>

      <rect x={0} y={0} width={VBW} height={VBH} fill="var(--color-canvas)" />

      <TitleBlock x={56} y={44} site={plano.site} />
      <LegendSensorial x={56} y={164} />
      <AccionesClave x={56} y={540} />

      <PlanoBody region={{ x: 420, y: 150, w: 756, h: 556 }} plano={plano} byId={byId} />
      <NorthScale x={432} y={724} scale={plano.scale} />

      <SelloBlock x={1216} y={164} profile={hero} />
      <MultilayerStack x={1216} y={438} profiles={profiles} />

      <NotaMetodologica x={56} y={792} w={1488} />
    </svg>
  );
});
