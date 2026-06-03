import { GRID_CELLS, type GenLevel } from "./types";

/**
 * Los 5 niveles de intensidad y su banda de OCUPACIÓN de la retícula.
 * La ocupación (módulos activos / 81) es el código primario de intensidad:
 * funciona en monocromo porque más módulos = más intenso, de forma legible.
 */
export interface GenLevelDef {
  idx: GenLevel;
  key: string;
  name: string;
  short: string;
  /** banda de ocupación [min, max] del brief */
  band: readonly [number, number];
  /** ocupación objetivo (punto dentro de la banda) */
  target: number;
}

export const GEN_LEVELS: readonly GenLevelDef[] = [
  { idx: 0, key: "muy-bajo", name: "Muy bajo", short: "Muy bajo", band: [0.1, 0.2], target: 0.15 },
  { idx: 1, key: "bajo", name: "Bajo", short: "Bajo", band: [0.25, 0.35], target: 0.3 },
  { idx: 2, key: "medio", name: "Medio", short: "Medio", band: [0.4, 0.55], target: 0.47 },
  { idx: 3, key: "alto", name: "Alto", short: "Alto", band: [0.6, 0.75], target: 0.675 },
  { idx: 4, key: "critico", name: "Crítico", short: "Crítico", band: [0.8, 0.95], target: 0.875 },
] as const;

export const GEN_LEVEL_IDS: GenLevel[] = [0, 1, 2, 3, 4];

/** nº de módulos a activar para un nivel (redondeo de la ocupación objetivo) */
export function cellsForLevel(level: GenLevel): number {
  return Math.round(GEN_LEVELS[level].target * GRID_CELLS);
}

/** ocupación objetivo como porcentaje entero, p. ej. 47 */
export function occupationPct(level: GenLevel): number {
  return Math.round(GEN_LEVELS[level].target * 100);
}

/** banda de ocupación como texto, p. ej. "40–55%" */
export function bandText(level: GenLevel): string {
  const [a, b] = GEN_LEVELS[level].band;
  return `${Math.round(a * 100)}–${Math.round(b * 100)}%`;
}
