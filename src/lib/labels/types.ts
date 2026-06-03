import type { CategoryId } from "../types";

/**
 * SISTEMA DE ETIQUETAS SENSORIALES (sellos de datos ambientales).
 *
 * No son pictogramas: son MARCADORES distintivos generados por datos. Una sola
 * estructura circular-radial codifica el perfil sensorial completo de un espacio
 * (las 7 categorías en posiciones angulares FIJAS, aprendibles). Cada categoría
 * aporta 7 parámetros que se traducen a atributos gráficos. El sello identifica
 * un perfil, motiva el escaneo y, al escanear, abre la ficha de anticipación.
 */

export type DataSource = "sensor" | "observation" | "survey";

/** parámetros evaluados de una categoría en un espacio (0..1, normalizados) */
export interface CategoryParams {
  /** intensidad promedio → expansión radial del módulo */
  intensity: number;
  /** pico máximo → acento en el anillo exterior */
  peak: number;
  /** variabilidad → continuidad / segmentación / fragmentación */
  variability: number;
  /** duración → grosor del trazo */
  duration: number;
  /** predictibilidad → orden o alteración del patrón */
  predictability: number;
  /** nivel de confianza del dato → marcador secundario / opacidad */
  confidence: number;
  /** fuente del dato → estilo del marcador secundario discreto */
  source: DataSource;
}

export type ProfileParams = Record<CategoryId, CategoryParams>;

export interface SensorProfile {
  id: string;
  /** código del perfil, p. ej. "PERF-01" */
  code: string;
  /** nombre del espacio */
  name: string;
  params: ProfileParams;
}

/**
 * ORDEN FIJO de las categorías alrededor del círculo (12:00 en sentido horario).
 * Es el orden del brief y no cambia nunca: es lo que hace el sistema aprendible.
 */
export const RING_ORDER: CategoryId[] = [
  "sound",
  "light",
  "flow",
  "wait",
  "orientation",
  "visual",
  "pause",
];

export const SOURCE_LABEL: Record<DataSource, string> = {
  sensor: "Sensor",
  observation: "Observación",
  survey: "Cuestionario",
};

export const SOURCE_SHORT: Record<DataSource, string> = {
  sensor: "SEN",
  observation: "OBS",
  survey: "CUE",
};
