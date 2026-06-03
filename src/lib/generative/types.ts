import type { CategoryId } from "../types";

/**
 * Sistema GENERATIVO reticular (mejora del sistema de pictogramas).
 *
 * A diferencia de los glifos literales del catálogo base (que usan metáforas
 * como altavoz, sol o reloj), aquí cada pictograma EMERGE de operaciones sobre
 * una retícula de 9 × 9 módulos. La retícula no es guía de composición: es el
 * motor formal. La identidad visual nace del comportamiento de la retícula y la
 * intensidad se codifica por OCUPACIÓN (cuántos módulos se activan), de modo que
 * el nivel se lee sin color, solo por forma, cantidad y densidad.
 *
 * Este subsistema es independiente del eje `Severity` (3 niveles) del resto de
 * la plataforma: usa su propia escala de 5 niveles (`GenLevel`).
 */
export type { CategoryId };

/** 0 Muy bajo · 1 Bajo · 2 Medio · 3 Alto · 4 Crítico */
export type GenLevel = 0 | 1 | 2 | 3 | 4;

/** lado de la retícula (9 × 9 = 81 módulos) */
export const GRID_N = 9;
export const GRID_CELLS = GRID_N * GRID_N;

/** Retícula de activación: grid[y][x] ∈ [0,1]. 0 = módulo vacío. */
export type Grid = number[][];

/** Cómo se dibuja el módulo activo: relleno (masa) o trazo (contención). */
export type MarkStyle = "fill" | "stroke";

export interface GenResult {
  /** retícula 9×9 de valores de activación */
  grid: Grid;
  /** módulos marcados como nodo de decisión (solo orientación): [x, y] */
  nodes: Array<[number, number]>;
}

/** Ficha completa de un pictograma generado (entregables del brief). */
export interface PictogramMeta {
  /** código del espécimen, p. ej. "SND·III" */
  code: string;
  categoryId: CategoryId;
  /** nombre de la categoría, p. ej. "Sonido" */
  category: string;
  level: GenLevel;
  /** nombre del nivel, p. ej. "Medio" */
  levelName: string;
  /** ocupación objetivo, p. ej. "≈47%" */
  occupation: string;
  /** operación reticular usada */
  operation: string;
  /** descripción visual de la forma resultante */
  description: string;
  /** etiqueta corta para la versión etiquetada */
  shortLabel: string;
  /** texto de lectura fácil */
  easyText: string;
  /** acción sugerida */
  action: string;
  /** texto alternativo para accesibilidad digital */
  alt: string;
  /** riesgo de mala interpretación */
  risk: string;
  /** recomendación de validación con usuarios */
  validation: string;
}

/** Las cuatro versiones exportables de cada pictograma. */
export type ExportVersion = "pictogram" | "labeled" | "contrast" | "sheet";
