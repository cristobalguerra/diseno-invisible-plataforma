/**
 * Modelo del sistema Diseño invisible.
 * Severity (severidad experiencial) es el eje que ordena los 3 niveles y dirige
 * tanto el color semafórico como el medidor. Para casi todas las categorías la
 * severidad sigue la magnitud medida; en `pause` se invierte (mucha
 * disponibilidad de descanso = severidad baja = verde).
 */
export type CategoryId =
  | "sound"
  | "light"
  | "flow"
  | "visual"
  | "wait"
  | "orientation"
  | "pause";

/** 0 = bajo/verde, 1 = medio/ámbar, 2 = alto/rojo */
export type Severity = 0 | 1 | 2;
export type SeverityName = "low" | "mid" | "high";

export interface LevelDef {
  /** severidad experiencial; indexa el nivel dentro de la categoría */
  sev: Severity;
  /** etiqueta natural del nivel, p. ej. "Ruido alto" */
  label: string;
  /** forma corta para chips/medidores, p. ej. "Alto" */
  short: string;
  /** mensaje breve para la señal física (paper §5.3) */
  message: string;
  /** decisión que habilita (Tabla 2) */
  decision: string;
  /** % de comprensión ISO 9186-1 (Tabla 7, valores ILUSTRATIVOS del paper) */
  comprehension?: number;
  /** marca de rediseño (p. ej. saturación visual, 69 % límite) */
  flag?: "review";
}

export interface CategoryDef {
  id: CategoryId;
  /** prefijo de código, p. ej. "SND" -> SND-3 */
  code: string;
  name: string;
  /** variable medida (Tabla 1) */
  variable: string;
  /** escala (Tabla 1) */
  scale: string;
  /** norma de umbral usada por la plataforma sensor-asistida (§4.4) */
  norm?: string;
  /** unidad física aproximada del sensado */
  unit?: string;
  /** significado en una línea */
  about: string;
  /** los 3 niveles, ordenados por severidad ascendente (0..2) */
  levels: [LevelDef, LevelDef, LevelDef];
  /** ¿suma a la carga sensorial de la zona? (orientación/pausa no suman directo) */
  loadCategory: boolean;
}

/** severidad seleccionada por categoría para una zona */
export type ZoneLevels = Record<CategoryId, Severity>;

export interface Zone {
  id: string;
  /** código corto editable, p. ej. "Z-03" */
  code: string;
  name: string;
  levels: ZoneLevels;
}

export type PriorityLevel = "alta" | "media" | "baja";

export interface PriorityResult {
  level: PriorityLevel;
  /** 0..10 suma de severidades de las categorías de carga */
  loadScore: number;
  /** nº de categorías de carga en nivel alto */
  highCount: number;
  reason: string;
  intervention: string;
}

export type ColorMode = "color" | "mono";
export type Variant = "outline" | "solid";
