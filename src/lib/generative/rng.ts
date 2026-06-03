/**
 * Generador pseudoaleatorio DETERMINISTA. El sistema es "generativo" pero no
 * azaroso: el mismo (categoría, nivel) produce siempre el mismo pictograma, de
 * modo que render y exportación coinciden y el catálogo es reproducible.
 */

/** mulberry32: PRNG rápido sembrado por un entero de 32 bits. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash FNV-1a de una lista de enteros → semilla estable de 32 bits. */
export function seedFrom(...nums: number[]): number {
  let h = 2166136261 >>> 0;
  for (const n of nums) {
    let v = n >>> 0;
    for (let b = 0; b < 4; b++) {
      h ^= v & 0xff;
      h = Math.imul(h, 16777619);
      v >>>= 8;
    }
  }
  return h >>> 0;
}
