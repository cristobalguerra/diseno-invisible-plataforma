import type { CategoryId } from "../types";
import { getCategory } from "../../data/catalog";
import { GEN_LEVELS, occupationPct } from "./levels";
import { OPERATION } from "./engine";
import type { GenLevel, PictogramMeta } from "./types";

const ROMAN = ["I", "II", "III", "IV", "V"];

/** descripción de la densidad por nivel (capa formal) */
const DENSITY = [
  "muy abierta y dominada por el vacío",
  "con una activación ligera y lectura tranquila",
  "con densidad intermedia, en equilibrio entre aire y ocupación",
  "con densidad alta, repetición y tensión visual",
  "saturada al máximo: compresión, ruptura e interferencia",
];

interface CategoryCopy {
  /** cómo se comporta la retícula (capa semántica) */
  behavior: string;
  /** riesgo de mala interpretación */
  risk: string;
  /** recomendación de validación con usuarios */
  validation: string;
  /** lectura fácil por nivel */
  easy: [string, string, string, string, string];
  /** acción sugerida por nivel */
  action: [string, string, string, string, string];
}

const COPY: Record<CategoryId, CategoryCopy> = {
  sound: {
    behavior:
      "Frentes de onda recorren la retícula; al subir la intensidad se multiplican y se interfieren entre sí.",
    risk: "Sin etiqueta, el patrón de ondas puede leerse como agua, señal inalámbrica o vibración genérica.",
    validation:
      "Validar que la densidad de onda se asocie con el nivel de ruido (prueba de asociación tipo ISO 9186-3).",
    easy: ["Casi no hay ruido.", "Hay poco ruido.", "Hay ruido moderado.", "Hay bastante ruido.", "El ruido es muy alto."],
    action: [
      "Recorrido tranquilo; sin ajuste.",
      "Ambiente apacible; sin ajuste.",
      "Anticipa conversación o concentración media.",
      "Considera una ruta más tranquila.",
      "Protégete del ruido o busca otra ruta.",
    ],
  },
  light: {
    behavior:
      "Un núcleo irradia hacia afuera; la luz se expande y gana rayos a medida que crece la intensidad.",
    risk: "La irradiación radial puede confundirse con una diana, un objetivo o un punto de interés.",
    validation:
      "Comprobar que la expansión radial se interprete como intensidad lumínica y no como 'centro' o 'destino'.",
    easy: ["La luz es muy tenue.", "La luz es tenue.", "La luz es media.", "La luz es intensa.", "La luz es muy intensa y puede deslumbrar."],
    action: [
      "Permanencia cómoda.",
      "Permanencia cómoda.",
      "Sin ajuste relevante.",
      "Anticipa la exposición lumínica.",
      "Protege la vista; evita la exposición prolongada.",
    ],
  },
  flow: {
    behavior:
      "Trayectorias diagonales atraviesan la retícula; al intensificarse aparecen cruces y turbulencia.",
    risk: "Las diagonales pueden leerse como tachado/cancelación o como lluvia en lugar de circulación.",
    validation: "Validar que las diagonales se asocien con flujo de personas y no con 'prohibido'.",
    easy: ["Pasa muy poca gente.", "Pasa poca gente.", "Hay circulación moderada.", "Pasa bastante gente.", "Hay mucha gente y poco espacio."],
    action: [
      "Circulación libre.",
      "Circulación libre.",
      "Circula con atención.",
      "Avanza con cuidado; puede haber congestión.",
      "Espera o elige una ruta alterna.",
    ],
  },
  wait: {
    behavior:
      "Los módulos se acumulan desde la base y se comprimen a medida que la espera se prolonga.",
    risk: "La masa acumulada puede leerse como nivel de llenado, batería o carga genérica.",
    validation: "Comprobar que la acumulación ascendente se interprete como duración de espera.",
    easy: ["Casi no hay que esperar.", "La espera es corta.", "La espera es media.", "La espera es larga.", "La espera es muy larga."],
    action: [
      "Avanza sin demora.",
      "Avanza casi sin demora.",
      "Prevé una pausa breve.",
      "Decide si esperar o regresar.",
      "Considera volver más tarde.",
    ],
  },
  orientation: {
    behavior:
      "Una ruta continua se bifurca, suma nodos de decisión y, al saturarse, se interrumpe y se pierde.",
    risk: "La red de rutas puede leerse como diagrama o circuito en vez de 'claridad del camino'.",
    validation:
      "Validar que continuidad = fácil y ruptura = confuso con usuarios en una tarea real de wayfinding.",
    easy: ["El camino es muy claro.", "El camino es claro.", "Hay un punto de decisión.", "Hay varias opciones de ruta.", "Es fácil perderse aquí."],
    action: [
      "Sigue el recorrido con confianza.",
      "Sigue el recorrido.",
      "Elige la dirección correcta.",
      "Fíjate bien antes de avanzar.",
      "Consulta el mapa antes de seguir.",
    ],
  },
  visual: {
    behavior:
      "Módulos dispersos de tamaño irregular saturan la retícula hasta perder la relación figura-fondo.",
    risk: "El ruido puede leerse como textura decorativa o error de impresión más que como saturación.",
    validation: "Comprobar que el aumento de ruido se asocie con sobrecarga visual y no con estilo.",
    easy: [
      "El entorno visual es muy limpio.",
      "Hay pocos estímulos visuales.",
      "Hay estímulos visuales moderados.",
      "Hay muchos estímulos visuales.",
      "El entorno visual está muy saturado.",
    ],
    action: [
      "Lectura visual cómoda.",
      "Lectura visual cómoda.",
      "Atención visual moderada.",
      "Ubica los puntos clave; reduce el foco.",
      "Busca referencias claras; evita la sobrecarga.",
    ],
  },
  pause: {
    behavior:
      "Un marco de contención rodea un vacío central; al subir el nivel el marco engrosa y el refugio se define con más fuerza.",
    risk: "El marco cerrado puede leerse como 'prohibido/cerrado' o como un simple recuadro, no como refugio.",
    validation:
      "Validar que el marco con vacío central se interprete como zona de calma/refugio y no como restricción.",
    easy: [
      "El refugio apenas se insinúa.",
      "Hay un refugio ligero.",
      "Hay una zona de refugio clara.",
      "El refugio es amplio y contenido.",
      "Refugio plenamente contenido y protegido.",
    ],
    action: [
      "Reduce estímulos un momento.",
      "Haz una pausa breve si lo necesitas.",
      "Buen punto para pausar.",
      "Zona adecuada para descansar y regularte.",
      "Refúgiate aquí para recuperar la calma.",
    ],
  },
};

/** Construye la ficha completa de un pictograma (los entregables del brief). */
export function pictogramMeta(categoryId: CategoryId, level: GenLevel): PictogramMeta {
  const cat = getCategory(categoryId);
  const lvl = GEN_LEVELS[level];
  const copy = COPY[categoryId];
  const occ = occupationPct(level);
  const occText = `≈${occ}%`;

  return {
    code: `${cat.code}·${ROMAN[level]}`,
    categoryId,
    category: cat.name,
    level,
    levelName: lvl.name,
    occupation: occText,
    operation: OPERATION[categoryId],
    description: `${copy.behavior} En nivel ${lvl.name} (${occ}% de ocupación) la retícula está ${DENSITY[level]}.`,
    shortLabel: `${cat.name} · ${lvl.short}`,
    easyText: copy.easy[level],
    action: copy.action[level],
    alt: `Pictograma reticular de ${cat.name.toLowerCase()}, intensidad ${lvl.name.toLowerCase()}, ${occ}% de ocupación de una retícula de 9 por 9 módulos. ${copy.easy[level]}`,
    risk: copy.risk,
    validation: copy.validation,
  };
}
