import type { CategoryId } from "../types";

/**
 * MODELO DEL PLANO (blueprint sensorial).
 *
 * Un `Plano` es la disposición espacial de los espacios YA medidos de un sitio
 * (p. ej. "Museo MARCO"): cada sala es un rectángulo en un lienzo de coordenadas
 * FIJO (independiente del render) que el usuario acomoda a mano. Cada sala se liga
 * a su `SensorProfile` por `profileId` (NUNCA por índice): así renombrar o
 * reordenar espacios jamás corrompe el layout.
 *
 * El sistema parte de un auto-acomodo determinista (ver lib/plano/layout.ts) y el
 * usuario lo edita libremente. La lámina exportable (PlanoSvg) consume este modelo.
 */

/** lienzo lógico del plano; el render lo mapea a la región central de la lámina */
export const PLANO_W = 1000;
export const PLANO_H = 640;

/** dimensiones mínimas de una sala (clamp del editor) */
export const ROOM_MIN_W = 80;
export const ROOM_MIN_H = 60;

export interface PlanoRoom {
  /** id del SensorProfile que esta sala representa */
  profileId: string;
  /** rectángulo en coordenadas del lienzo (0..PLANO_W × 0..PLANO_H) */
  x: number;
  y: number;
  w: number;
  h: number;
  /** rotación en grados (sobre el centro de la sala); 0 si se omite */
  rot?: number;
  /** categorías cuyo chip se muestra en la sala (subconjunto de RING_ORDER, 2–3 típico) */
  chips: CategoryId[];
}

export interface Plano {
  /** sitio al que pertenece; coincide con SensorProfile.site (clave de identidad) */
  site: string;
  /** título editable de la lámina (por defecto el nombre del sitio) */
  title: string;
  /** texto de la barra de escala, p. ej. "0 · 2 · 5 · 10 m" */
  scale: string;
  /** punto de acceso del recorrido (borde de la primera sala) */
  entrance?: { x: number; y: number };
  rooms: PlanoRoom[];
}

/** repositorio de planos: un layout por sitio */
export type PlanoMap = Record<string, Plano>;

/** escala por defecto que se muestra en la lámina */
export const DEFAULT_SCALE = "0    2    5         10 m";
