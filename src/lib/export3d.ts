/**
 * EXPORTACIÓN 3D del sello sensorial como RELIEVE TÁCTIL imprimible (STL).
 *
 * Multimodalidad (PRODUCT.md ·7): al imprimir, el color desaparece, así que la
 * lectura pasa a posición + forma + ALTURA + texto. El relieve vuelve literal la
 * redundancia perceptiva: se palpa el perfil sensorial del espacio con el dedo.
 *
 * Codificación (isomorfa al sello en pantalla, sin color):
 *   longitud del radio  = intensidad
 *   ALTURA del relieve  = intensidad   (el canal más táctil: cresta alta = intenso)
 *   ancho del radio     = duración
 *   tick en el cubo     = posición de cada categoría (palpable aun en intensidad baja)
 *   marca a las 12      = inicio del RING_ORDER (sound), para orientar y contar
 *   braille en la placa = código del espacio (lectura sin vista)
 *
 * Sin dependencias: se emite la malla como triángulos y se serializa a STL binario.
 * Unidades en milímetros (lo que asumen los slicers). Base plana sobre la cama;
 * todo el relieve crece en +Z (orientación ideal para FDM).
 */
import type { SensorProfile } from "./labels/types";
import { RING_ORDER } from "./labels/types";

type V3 = readonly [number, number, number];

// ---- dimensiones (mm) -------------------------------------------------------
const R = 30; // radio del disco (Ø60)
const BASE = 3; // grosor de la base
const HUB_R = 8; // radio del cubo central
const LEN_MIN = 2, LEN_MAX = 15; // longitud del radio (intensidad)
const W_MIN = 2.6, W_MAX = 6; // ancho del radio (duración)
const H_MIN = 1.2, H_MAX = 6; // altura del relieve (intensidad)
const SEG = 64; // facetas del disco

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

// ---- emisión de triángulos --------------------------------------------------
function tri(out: number[], a: V3, b: V3, c: V3) {
  out.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
}
function quad(out: number[], a: V3, b: V3, c: V3, d: V3) {
  tri(out, a, b, c);
  tri(out, a, c, d);
}

/** caja (prisma) centrada en (cx,cy), de z0 a z1, hl a lo largo de (dx,dy) y hw perpendicular */
function addBox(out: number[], cx: number, cy: number, z0: number, z1: number, hl: number, hw: number, dx: number, dy: number) {
  const px = -dy, py = dx;
  const c = (s: number, t: number, z: number): V3 => [cx + s * hl * dx + t * hw * px, cy + s * hl * dy + t * hw * py, z];
  const A = c(-1, -1, z0), B = c(1, -1, z0), C = c(1, 1, z0), D = c(-1, 1, z0);
  const A2 = c(-1, -1, z1), B2 = c(1, -1, z1), C2 = c(1, 1, z1), D2 = c(-1, 1, z1);
  quad(out, A2, B2, C2, D2); // tapa
  quad(out, A, D, C, B); // fondo
  quad(out, A, B, B2, A2);
  quad(out, B, C, C2, B2);
  quad(out, C, D, D2, C2);
  quad(out, D, A, A2, D2);
}

/** cilindro/prisma centrado en (cx,cy), de z0 a z1, radio r, seg facetas */
function addCyl(out: number[], cx: number, cy: number, z0: number, z1: number, r: number, seg: number) {
  const top: V3 = [cx, cy, z1], bot: V3 = [cx, cy, z0];
  const ring = (k: number, z: number): V3 => {
    const a = (2 * Math.PI * k) / seg;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), z];
  };
  for (let k = 0; k < seg; k++) {
    const a0 = ring(k, z1), a1 = ring((k + 1) % seg, z1);
    const b0 = ring(k, z0), b1 = ring((k + 1) % seg, z0);
    tri(out, top, a0, a1); // tapa
    tri(out, bot, b1, b0); // fondo
    quad(out, b0, b1, a1, a0); // pared
  }
}

// ---- braille (grado 1) ------------------------------------------------------
// puntos 1..6 → 1:sup-izq 2:med-izq 3:inf-izq 4:sup-der 5:med-der 6:inf-der
const BR: Record<string, number[]> = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5], f: [1, 2, 4], g: [1, 2, 4, 5], h: [1, 2, 5], i: [2, 4], j: [2, 4, 5],
  k: [1, 3], l: [1, 2, 3], m: [1, 3, 4], n: [1, 3, 4, 5], o: [1, 3, 5], p: [1, 2, 3, 4], q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5], s: [2, 3, 4], t: [2, 3, 4, 5],
  u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6], x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
  "-": [3, 6], " ": [],
};
const NUM_SIGN = [3, 4, 5, 6];
const DIGIT: Record<string, string> = { "1": "a", "2": "b", "3": "c", "4": "d", "5": "e", "6": "f", "7": "g", "8": "h", "9": "i", "0": "j" };
const DOT_DX = 2.4, DOT_DY = 2.4, CELL_PITCH = 6.0, DOT_R = 0.72, DOT_H = 0.7;
const DOT_POS: Record<number, [number, number]> = { 1: [0, 2], 2: [0, 1], 3: [0, 0], 4: [1, 2], 5: [1, 1], 6: [1, 0] };

function brailleCells(text: string): number[][] {
  const cells: number[][] = [];
  let inNum = false;
  for (const ch of text.toLowerCase()) {
    if (ch >= "0" && ch <= "9") {
      if (!inNum) { cells.push(NUM_SIGN); inNum = true; }
      cells.push(BR[DIGIT[ch]]);
    } else {
      inNum = false;
      cells.push(BR[ch] ?? []);
    }
  }
  return cells;
}

function addBraille(out: number[], text: string, cyCenter: number, z0: number) {
  const cells = brailleCells(text);
  const totalW = (cells.length - 1) * CELL_PITCH + DOT_DX;
  const x0 = -totalW / 2;
  const yBlock = cyCenter - DOT_DY; // centra las 3 filas (0..2*DOT_DY)
  cells.forEach((dots, i) => {
    const cx = x0 + i * CELL_PITCH;
    for (const d of dots) {
      const [col, row] = DOT_POS[d];
      addCyl(out, cx + col * DOT_DX, yBlock + row * DOT_DY, z0, z0 + DOT_H, DOT_R, 10);
    }
  });
  return totalW;
}

// ---- ensamblado del sello ---------------------------------------------------
export function buildSealTriangles(profile: SensorProfile): number[] {
  const out: number[] = [];

  // disco base
  addCyl(out, 0, 0, 0, BASE, R, SEG);

  // radios por categoría (RING_ORDER, 0 = arriba, sentido horario)
  RING_ORDER.forEach((id, i) => {
    const p = profile.params[id];
    const inten = clamp01(p.intensity), dur = clamp01(p.duration);
    const th = (i * 2 * Math.PI) / RING_ORDER.length;
    const dx = Math.sin(th), dy = Math.cos(th); // horario desde +Y (arriba)
    const len = LEN_MIN + inten * (LEN_MAX - LEN_MIN);
    const hw = (W_MIN + dur * (W_MAX - W_MIN)) / 2;
    const h = H_MIN + inten * (H_MAX - H_MIN);
    const rc = HUB_R + len / 2;
    addBox(out, rc * dx, rc * dy, BASE, BASE + h, len / 2, hw, dx, dy);
    // tick de posición en el borde del cubo (toda categoría es palpable)
    addCyl(out, HUB_R * dx, HUB_R * dy, BASE, BASE + 1.6, 1.1, 10);
  });

  // marca de orientación a las 12 (inicio del orden)
  addCyl(out, 0, HUB_R + LEN_MAX + 3, BASE, BASE + 2.4, 1.7, 12);

  // cubo central + punto
  addCyl(out, 0, 0, BASE, BASE + 2.6, HUB_R, 40);
  addCyl(out, 0, 0, BASE + 2.6, BASE + 3.3, 2.2, 20);

  // placa inferior con el código en braille (fusionada al disco)
  const cells = brailleCells(profile.code);
  const brW = (cells.length - 1) * CELL_PITCH + DOT_DX;
  const tabW = Math.max(brW + 8, 28);
  const tabH = 12;
  const tabCY = -(R + tabH / 2 - 4); // solapa el disco ~4 mm
  addBox(out, 0, tabCY, 0, BASE, tabW / 2, tabH / 2, 1, 0);
  addBraille(out, profile.code, tabCY, BASE);

  return out;
}

// ---- serialización STL binario ---------------------------------------------
export function sealStlBuffer(profile: SensorProfile): ArrayBuffer {
  const tris = buildSealTriangles(profile);
  const n = tris.length / 9;
  const buf = new ArrayBuffer(84 + n * 50);
  const dv = new DataView(buf);
  const header = "Diseno invisible - sello sensorial - relieve haptico";
  for (let i = 0; i < header.length && i < 80; i++) dv.setUint8(i, header.charCodeAt(i));
  dv.setUint32(80, n, true);
  let off = 84;
  for (let t = 0; t < n; t++) {
    const o = t * 9;
    const ax = tris[o], ay = tris[o + 1], az = tris[o + 2];
    const bx = tris[o + 3], by = tris[o + 4], bz = tris[o + 5];
    const cx = tris[o + 6], cy = tris[o + 7], cz = tris[o + 8];
    let nx = (by - ay) * (cz - az) - (bz - az) * (cy - ay);
    let ny = (bz - az) * (cx - ax) - (bx - ax) * (cz - az);
    let nz = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
    const L = Math.hypot(nx, ny, nz) || 1;
    nx /= L; ny /= L; nz /= L;
    dv.setFloat32(off, nx, true); dv.setFloat32(off + 4, ny, true); dv.setFloat32(off + 8, nz, true);
    dv.setFloat32(off + 12, ax, true); dv.setFloat32(off + 16, ay, true); dv.setFloat32(off + 20, az, true);
    dv.setFloat32(off + 24, bx, true); dv.setFloat32(off + 28, by, true); dv.setFloat32(off + 32, bz, true);
    dv.setFloat32(off + 36, cx, true); dv.setFloat32(off + 40, cy, true); dv.setFloat32(off + 44, cz, true);
    dv.setUint16(off + 48, 0, true);
    off += 50;
  }
  return buf;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSealStl(profile: SensorProfile, filename: string) {
  const blob = new Blob([sealStlBuffer(profile)], { type: "model/stl" });
  triggerDownload(blob, filename.endsWith(".stl") ? filename : `${filename}.stl`);
}
