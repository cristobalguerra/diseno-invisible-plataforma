import type { Zone, ZoneLevels } from "../lib/types";

/** helper conciso para declarar niveles por zona, en orden de catálogo */
function lv(
  sound: number, light: number, flow: number, visual: number,
  wait: number, orientation: number, pause: number,
): ZoneLevels {
  return {
    sound, light, flow, visual, wait, orientation, pause,
  } as ZoneLevels;
}

/**
 * Recorrido por defecto de un museo como laboratorio vivo (paper §4.3):
 * entrada → recepción → sala principal → mayor concentración → pausa → salida.
 * Datos ilustrativos para demostrar el sistema; editables por el usuario.
 */
export const DEFAULT_ZONES: Zone[] = [
  { id: "z1", code: "Z-01", name: "Entrada", levels: lv(1, 1, 2, 1, 1, 1, 2) },
  { id: "z2", code: "Z-02", name: "Recepción", levels: lv(1, 1, 1, 0, 2, 0, 1) },
  { id: "z3", code: "Z-03", name: "Sala principal", levels: lv(1, 2, 1, 2, 0, 1, 2) },
  { id: "z4", code: "Z-04", name: "Mayor concentración", levels: lv(2, 1, 2, 2, 1, 2, 2) },
  { id: "z5", code: "Z-05", name: "Zona de pausa", levels: lv(0, 0, 0, 0, 0, 0, 0) },
  { id: "z6", code: "Z-06", name: "Salida", levels: lv(0, 0, 1, 0, 0, 0, 1) },
];

export function emptyLevels(): ZoneLevels {
  return lv(0, 0, 0, 0, 0, 0, 0);
}
