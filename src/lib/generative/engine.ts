import type { CategoryId } from "../types";
import { CATEGORY_IDS } from "../../data/catalog";
import { mulberry32, seedFrom } from "./rng";
import { cellsForLevel } from "./levels";
import { GRID_N, type GenLevel, type GenResult, type Grid, type MarkStyle } from "./types";

/**
 * MOTOR FORMAL. Cada categoría define un CAMPO sobre la retícula 9×9: una
 * función que asigna a cada módulo un peso (prioridad de activación) y un valor
 * de render (tamaño/intensidad del módulo). El nivel fija CUÁNTOS módulos se
 * activan (la ocupación); el campo decide CUÁLES y CÓMO. Así la operación da la
 * identidad y la ocupación da la intensidad, las dos capas del brief.
 *
 *   activación → selección de los N módulos de mayor peso
 *   vacío      → los módulos no seleccionados
 *   densidad   → N crece con el nivel
 *   el resto (repetición, dirección, ruptura, acumulación, irradiación,
 *   vibración, interferencia) son la FORMA del campo de cada categoría.
 */

const C = (GRID_N - 1) / 2; // centro = 4
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/** estilo de marca por categoría (pausa = contención por trazo) */
export const MARK_STYLE: Record<CategoryId, MarkStyle> = {
  sound: "fill",
  light: "fill",
  flow: "fill",
  wait: "fill",
  orientation: "fill",
  visual: "fill",
  pause: "stroke",
};

/** etiqueta de la operación reticular por categoría */
export const OPERATION: Record<CategoryId, string> = {
  sound: "Vibración e interferencia de ondas",
  light: "Irradiación radial y expansión",
  flow: "Trayectorias y cruces direccionales",
  wait: "Acumulación y compresión",
  orientation: "Continuidad, bifurcación y nodos de decisión",
  visual: "Interferencia y ruido reticular",
  pause: "Contención y vacío de refugio",
};

interface CellW {
  x: number;
  y: number;
  w: number; // peso de selección
  v: number; // valor de render 0..1
}

function catIndex(category: CategoryId): number {
  return CATEGORY_IDS.indexOf(category);
}

function emptyGrid(): Grid {
  return Array.from({ length: GRID_N }, () => Array.from({ length: GRID_N }, () => 0));
}

/** selecciona los N módulos de mayor peso y escribe su valor en la retícula */
function pickTop(cells: CellW[], n: number): Grid {
  const sorted = [...cells].sort((a, b) => b.w - a.w || a.y - b.y || a.x - b.x);
  const grid = emptyGrid();
  const take = Math.min(n, sorted.length);
  for (let i = 0; i < take; i++) {
    const c = sorted[i];
    grid[c.y][c.x] = clamp01(c.v);
  }
  return grid;
}

/* ------------------------------------------------------------------ campos -- */

/** SONIDO — dos frentes de onda con frecuencias distintas → vibración + interferencia */
function fieldSound(x: number, y: number): { w: number; v: number } {
  const f = (2 * Math.PI) / GRID_N;
  const w1 = 3 + 1.7 * Math.sin(f * 1.0 * x + 0.2); // onda superior
  const w2 = 5.5 + 1.7 * Math.sin(f * 1.45 * x + 1.6); // onda inferior (interfiere)
  const d = Math.min(Math.abs(y - w1), Math.abs(y - w2));
  const w = 1 / (1 + d * d * 0.7);
  const v = clamp01(0.5 + 0.5 / (1 + d)); // crestas llenas, vibración hacia los bordes
  return { w, v };
}

/** LUZ — irradiación desde el centro + 6 rayos → expansión y apertura */
function fieldLight(x: number, y: number): { w: number; v: number } {
  const dx = x - C;
  const dy = y - C;
  const r = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const ray = 0.5 + 0.5 * Math.cos(6 * ang);
  const w = 1 - r / 5.66 + 0.38 * ray * (r > 0.001 ? 1 : 0);
  const v = clamp01(1 - r / 6 + 0.12 * ray); // núcleo brillante, desvanece al expandir
  return { w, v };
}

/** FLUJO — diagonales paralelas (corriente) + una anti-diagonal (cruce) */
function fieldFlow(x: number, y: number): { w: number; v: number } {
  const streams = [-3, 0, 3]; // x - y = k
  let dMain = Infinity;
  for (const k of streams) dMain = Math.min(dMain, Math.abs(x - y - k));
  const dCross = Math.abs(x + y - 8); // anti-diagonal
  const wMain = 1 / (1 + dMain * dMain * 1.1);
  const wCross = 0.62 / (1 + dCross * dCross * 1.1);
  const w = Math.max(wMain, wCross);
  const v = clamp01(0.66 + 0.34 * w);
  return { w, v };
}

/** ESPERA — acumulación por gravedad: se llena de abajo hacia arriba, centrado */
function fieldWait(x: number, y: number): { w: number; v: number } {
  const w = y * 10 + (4 - Math.abs(x - C)); // filas bajas primero; centro antes que bordes
  const v = clamp01(0.8 + 0.2 * (y / 8)); // más masa/compresión abajo
  return { w, v };
}

/** SATURACIÓN — ruido reticular: dispersión y tamaños irregulares (clutter) */
function fieldVisual(noise: number[][], noise2: number[][], x: number, y: number): { w: number; v: number } {
  const w = noise[y][x];
  const v = clamp01(0.42 + 0.58 * noise2[y][x]); // tamaños dispares = superposición/ruido
  return { w, v };
}

/** PAUSA — contención: anillos cuadrados desde el borde, vacío central de refugio */
function fieldPause(x: number, y: number): { w: number; v: number } {
  const r = Math.max(Math.abs(x - C), Math.abs(y - C)); // distancia Chebyshev → anillos
  const ang = Math.atan2(y - C, x - C);
  // reparto angular de baja discrepancia: los anillos parciales quedan simétricos
  const sub = (((ang / Math.PI + 1) * 0.5 + 0.30901699) % 1) * 0.9;
  const w = r * 100 + sub; // borde primero; centro (refugio) nunca se llena
  return { w, v: 0.85 };
}

/* ------------------------------------------------------ orientación (ruta) -- */

/**
 * ORIENTACIÓN es estructural y depende del nivel: ruta continua → bifurcación →
 * nodos → interrupción/pérdida de ruta. Construimos un mapa de pesos explícito.
 */
function generateOrientation(level: GenLevel): GenResult {
  const W = Array.from({ length: GRID_N }, () => Array.from({ length: GRID_N }, () => 0.04));
  const V = Array.from({ length: GRID_N }, () => Array.from({ length: GRID_N }, () => 0.5));
  const stamp = (x: number, y: number, w: number, v: number) => {
    if (x < 0 || y < 0 || x >= GRID_N || y >= GRID_N) return;
    if (w > W[y][x]) W[y][x] = w;
    V[y][x] = v;
  };

  // tronco vertical central (continuidad) — la ruta clara
  for (let y = 1; y <= 8; y++) stamp(C, y, y >= 4 ? 1.0 : 0.95, 0.95);
  // ramas desde el nodo central (bifurcación)
  for (let x = 5; x <= 7; x++) stamp(x, C, 0.74 - (x - 5) * 0.03, 0.92);
  for (let x = 3; x >= 1; x--) stamp(x, C, 0.7 - (3 - x) * 0.03, 0.92);
  // horquilla superior
  stamp(3, 2, 0.58, 0.9);
  stamp(2, 1, 0.55, 0.9);
  stamp(5, 2, 0.54, 0.9);
  stamp(6, 1, 0.5, 0.9);
  // fragmentos / cabos sueltos (pérdida de ruta) — solo entran en niveles altos
  const fragments: Array<[number, number]> = [
    [1, 7], [2, 7], [7, 6], [8, 6], [7, 2], [7, 1], [1, 2], [0, 5], [6, 8], [1, 4],
  ];
  for (const [fx, fy] of fragments) stamp(fx, fy, 0.34, 0.7);

  // interrupción del tronco en nivel crítico (ruptura → ruta rota)
  if (level === 4) {
    W[6][C] = 0; // gap
    W[3][C] = 0; // gap
  }

  const cells: CellW[] = [];
  for (let y = 0; y < GRID_N; y++)
    for (let x = 0; x < GRID_N; x++) cells.push({ x, y, w: W[y][x], v: V[y][x] });
  const grid = pickTop(cells, cellsForLevel(level));

  // nodos de decisión: se marcan si el módulo quedó activo
  const candidates: Array<[number, number]> = [[C, C]];
  if (level >= 2) candidates.push([C, 2]);
  if (level >= 3) candidates.push([7, C], [1, C]);
  const nodes = candidates.filter(([nx, ny]) => grid[ny][nx] > 0);
  return { grid, nodes };
}

/* ----------------------------------------------------------------- público -- */

/** Genera la retícula 9×9 de un pictograma (determinista por categoría+nivel). */
export function generate(category: CategoryId, level: GenLevel): GenResult {
  if (category === "orientation") return generateOrientation(level);

  const rng = mulberry32(seedFrom(catIndex(category), level, 0x9e37));
  const noise = Array.from({ length: GRID_N }, () => Array.from({ length: GRID_N }, () => rng()));
  const noise2 = Array.from({ length: GRID_N }, () => Array.from({ length: GRID_N }, () => rng()));

  const cells: CellW[] = [];
  for (let y = 0; y < GRID_N; y++) {
    for (let x = 0; x < GRID_N; x++) {
      let r: { w: number; v: number };
      switch (category) {
        case "sound": r = fieldSound(x, y); break;
        case "light": r = fieldLight(x, y); break;
        case "flow": r = fieldFlow(x, y); break;
        case "wait": r = fieldWait(x, y); break;
        case "visual": r = fieldVisual(noise, noise2, x, y); break;
        case "pause": r = fieldPause(x, y); break;
        default: r = { w: 0, v: 0 };
      }
      cells.push({ x, y, w: r.w, v: r.v });
    }
  }
  return { grid: pickTop(cells, cellsForLevel(level)), nodes: [] };
}

/** ocupación real (módulos activos / 81) de una retícula generada */
export function actualOccupation(grid: Grid): number {
  let n = 0;
  for (const row of grid) for (const v of row) if (v > 0) n++;
  return n / (GRID_N * GRID_N);
}

/** mapeo del nivel (5) al color semafórico (3) — el color es apoyo secundario */
export function levelToSeverity(level: GenLevel): 0 | 1 | 2 {
  return ([0, 0, 1, 2, 2] as const)[level];
}
