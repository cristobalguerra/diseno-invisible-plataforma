import type { CategoryId } from "../types";
import type { SensorProfile } from "../labels/types";
import { RING_ORDER } from "../labels/types";
import type { PlanoRoom } from "./types";
import { PLANO_W, PLANO_H, ROOM_MIN_W, ROOM_MIN_H } from "./types";

/* ------------------------------------------------------------------ chips -- */

/** categorías que suman a la carga sensorial (Tabla 1); orientación/pausa no. */
const LOAD_CATS: CategoryId[] = ["sound", "light", "flow", "visual", "wait"];

const ringIndex = (c: CategoryId) => RING_ORDER.indexOf(c);

/**
 * Default de chips de una sala: las categorías de CARGA más intensas (2–3).
 * Determinista: orden por intensidad desc, desempate por posición en RING_ORDER.
 * Filtra ruido (<0.15); si todas son neutras, cae a las primeras del ranking.
 * Garantiza ≥1 chip.
 */
export function defaultChips(p: SensorProfile, n = 3): CategoryId[] {
  const ranked = [...LOAD_CATS].sort((a, b) => {
    const d = p.params[b].intensity - p.params[a].intensity;
    return d !== 0 ? d : ringIndex(a) - ringIndex(b);
  });
  const relevant = ranked.filter((c) => p.params[c].intensity >= 0.15);
  const pick = (relevant.length ? relevant : ranked).slice(0, Math.max(1, n));
  // devuelve en orden de RING_ORDER (coincide con el orden angular del sello)
  return RING_ORDER.filter((c) => pick.includes(c));
}

/* ----------------------------------------------------------------- layout -- */

const PAD = 40;
const GAP = 24;
const round = (n: number) => Math.round(n);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** nº de columnas para n salas: rejilla casi cuadrada, máx. 5 columnas */
function colsFor(n: number): number {
  return clamp(Math.ceil(Math.sqrt(Math.max(1, n))), 1, 5);
}

/**
 * Auto-acomodo determinista en serpentina (boustrophedon): las salas se colocan
 * en una rejilla y las filas impares se recorren en sentido inverso, de modo que
 * el orden de la secuencia (= recorrido) se lee como un camino continuo. Sin
 * aleatoriedad: misma entrada → mismo resultado.
 */
export function autoLayout(spaces: SensorProfile[]): { rooms: PlanoRoom[]; entrance?: { x: number; y: number } } {
  const n = spaces.length;
  if (n === 0) return { rooms: [] };

  const cols = colsFor(n);
  const rows = Math.ceil(n / cols);
  const usableW = PLANO_W - 2 * PAD;
  const usableH = PLANO_H - 2 * PAD;
  const cellW = Math.max(ROOM_MIN_W, (usableW - (cols - 1) * GAP) / cols);
  const cellH = Math.max(ROOM_MIN_H, (usableH - (rows - 1) * GAP) / rows);

  const rooms: PlanoRoom[] = spaces.map((p, i) => {
    const row = Math.floor(i / cols);
    const colRaw = i % cols;
    const col = row % 2 === 1 ? cols - 1 - colRaw : colRaw; // serpentina
    return {
      profileId: p.id,
      x: round(PAD + col * (cellW + GAP)),
      y: round(PAD + row * (cellH + GAP)),
      w: round(cellW),
      h: round(cellH),
      chips: defaultChips(p),
    };
  });

  const first = rooms[0];
  const entrance = { x: first.x, y: round(first.y + first.h / 2) };
  return { rooms, entrance };
}

/** mediana simple (para tamaños de sala al agregar) */
function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * Coloca salas para espacios recién añadidos a un sitio, debajo del flujo
 * existente, conservando intactas las posiciones que el usuario ya editó.
 */
export function appendRooms(existing: PlanoRoom[], newSpaces: SensorProfile[]): PlanoRoom[] {
  if (!newSpaces.length) return [];
  const w = round(median(existing.map((r) => r.w)) || 180);
  const h = round(median(existing.map((r) => r.h)) || 120);
  const bottom = existing.length ? Math.max(...existing.map((r) => r.y + r.h)) : PAD - GAP;
  let startY = bottom + GAP;

  const perRow = Math.max(1, Math.floor((PLANO_W - 2 * PAD + GAP) / (w + GAP)));
  const out: PlanoRoom[] = [];
  newSpaces.forEach((p, i) => {
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    out.push({
      profileId: p.id,
      x: round(PAD + col * (w + GAP)),
      y: round(startY + row * (h + GAP)),
      w,
      h,
      chips: defaultChips(p),
    });
  });
  return out;
}
