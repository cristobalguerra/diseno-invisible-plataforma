import type { CategoryDef, CategoryId, Severity, SeverityName } from "../lib/types";

/**
 * CATÁLOGO EDITABLE del sistema Diseño invisible.
 * Las 7 categorías sensoriales (Tabla 1), cada una con 3 niveles ordenados por
 * severidad. Textos de decisión = Tabla 2; % de comprensión = Tabla 7 (valores
 * ILUSTRATIVOS del borrador, sustituir por datos reales antes de difundir).
 *
 * Para editar el sistema: cambia etiquetas, mensajes, decisiones o umbrales aquí.
 */
export const CATEGORIES: CategoryDef[] = [
  {
    id: "sound",
    code: "SND",
    name: "Sonido",
    variable: "Ruido ambiental",
    scale: "Intensidad sonora",
    norm: "OMS · ISO 1996",
    unit: "dB(A)",
    about: "Nivel de ruido del entorno y su efecto sobre la concentración.",
    loadCategory: true,
    levels: [
      { sev: 0, label: "Entorno silencioso", short: "Bajo", message: "Ruido bajo", decision: "Recorrido tranquilo; sin ajuste necesario." },
      { sev: 1, label: "Ruido moderado", short: "Medio", message: "Ruido moderado", decision: "Anticipar conversación o concentración media." },
      { sev: 2, label: "Ruido alto", short: "Alto", message: "Ruido alto", decision: "Prepararse o buscar una ruta tranquila.", comprehension: 89 },
    ],
  },
  {
    id: "light",
    code: "LGT",
    name: "Luz",
    variable: "Iluminación ambiental",
    scale: "Intensidad lumínica",
    norm: "EN 12464-1",
    unit: "lux",
    about: "Intensidad y carácter de la luz; advierte exposición o parpadeo.",
    loadCategory: true,
    levels: [
      { sev: 0, label: "Luz tenue y estable", short: "Baja", message: "Luz tenue", decision: "Permanencia cómoda." },
      { sev: 1, label: "Luz media", short: "Media", message: "Luz media", decision: "Sin ajuste relevante." },
      { sev: 2, label: "Luz intensa", short: "Alta", message: "Luz intensa", decision: "Anticipar la exposición lumínica.", comprehension: 84 },
    ],
  },
  {
    id: "flow",
    code: "FLW",
    name: "Flujo",
    variable: "Movimiento de personas",
    scale: "Densidad de flujo",
    norm: "Fruin (niveles de servicio)",
    unit: "pers/m²",
    about: "Densidad y circulación de personas en el espacio.",
    loadCategory: true,
    levels: [
      { sev: 0, label: "Flujo bajo", short: "Bajo", message: "Flujo bajo", decision: "Circulación libre." },
      { sev: 1, label: "Flujo medio", short: "Medio", message: "Flujo medio", decision: "Circular con atención." },
      { sev: 2, label: "Flujo alto", short: "Alto", message: "Flujo alto", decision: "Esperar o elegir una ruta alterna.", comprehension: 81 },
    ],
  },
  {
    id: "visual",
    code: "VIS",
    name: "Saturación visual",
    variable: "Estímulos visuales",
    scale: "Carga visual",
    norm: "Índice de clutter (Rosenholtz)",
    unit: "—",
    about: "Cantidad de estímulos visuales competidores en el campo de visión.",
    loadCategory: true,
    levels: [
      { sev: 0, label: "Carga visual baja", short: "Baja", message: "Saturación baja", decision: "Lectura visual cómoda." },
      { sev: 1, label: "Carga visual media", short: "Media", message: "Saturación media", decision: "Atención visual moderada." },
      { sev: 2, label: "Saturación visual alta", short: "Alta", message: "Saturación alta", decision: "Ubicar puntos clave; reducir foco.", comprehension: 69, flag: "review" },
    ],
  },
  {
    id: "wait",
    code: "WAI",
    name: "Espera",
    variable: "Tiempo de permanencia",
    scale: "Duración de espera",
    unit: "min",
    about: "Tiempo previsible de fila o permanencia en un punto.",
    loadCategory: true,
    levels: [
      { sev: 0, label: "Espera corta", short: "Corta", message: "Espera corta", decision: "Avanzar sin demora." },
      { sev: 1, label: "Espera media", short: "Media", message: "Espera media", decision: "Prever una pausa breve." },
      { sev: 2, label: "Espera prolongada", short: "Prolongada", message: "Espera prolongada", decision: "Decidir si esperar o regresar.", comprehension: 86 },
    ],
  },
  {
    id: "orientation",
    code: "ORI",
    name: "Orientación",
    variable: "Claridad del recorrido",
    scale: "Complejidad espacial",
    about: "Facilidad para construir un mapa mental y decidir la dirección.",
    loadCategory: false,
    levels: [
      { sev: 0, label: "Orientación clara", short: "Clara", message: "Orientación clara", decision: "Seguir el recorrido con confianza.", comprehension: 74 },
      { sev: 1, label: "Punto de decisión", short: "Media", message: "Punto de decisión", decision: "Elegir la dirección correcta.", comprehension: 71 },
      { sev: 2, label: "Orientación confusa", short: "Confusa", message: "Orientación confusa", decision: "Consultar el mapa antes de avanzar." },
    ],
  },
  {
    id: "pause",
    code: "PAU",
    name: "Pausa",
    variable: "Posibilidad de descanso",
    scale: "Disponibilidad de pausa",
    about: "Disponibilidad de zonas de baja estimulación para descansar.",
    loadCategory: false,
    levels: [
      { sev: 0, label: "Zona de pausa", short: "Disponible", message: "Zona tranquila", decision: "Pausar o regular el recorrido.", comprehension: 78 },
      { sev: 1, label: "Pausa limitada", short: "Limitada", message: "Pausa limitada", decision: "Descanso breve si es necesario." },
      { sev: 2, label: "Sin zona de pausa", short: "Baja", message: "Sin pausa cercana", decision: "Planear el descanso más adelante." },
    ],
  },
];

export const CATEGORY_IDS: CategoryId[] = CATEGORIES.map((c) => c.id);

const BY_ID: Record<CategoryId, CategoryDef> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryDef>;

export function getCategory(id: CategoryId): CategoryDef {
  return BY_ID[id];
}

/** código de espécimen, p. ej. SND-3 (nivel = severidad + 1) */
export function levelCode(id: CategoryId, sev: Severity): string {
  return `${BY_ID[id].code}-${sev + 1}`;
}

export const SEVERITY_NAME: Record<Severity, SeverityName> = { 0: "low", 1: "mid", 2: "high" };
export const SEVERITY_LABEL: Record<Severity, string> = { 0: "Bajo", 1: "Medio", 2: "Alto" };

/** token de color semafórico por severidad (coincide con index.css) */
export const SEVERITY_COLOR: Record<Severity, string> = {
  0: "var(--color-low)",
  1: "var(--color-mid)",
  2: "var(--color-high)",
};
export const SEVERITY_BG: Record<Severity, string> = {
  0: "var(--color-low-bg)",
  1: "var(--color-mid-bg)",
  2: "var(--color-high-bg)",
};
