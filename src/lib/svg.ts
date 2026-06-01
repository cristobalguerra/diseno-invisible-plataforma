/** geometría para los glifos. 0° = arriba (12 en punto), sentido horario. */
export function polar(cx: number, cy: number, r: number, deg: number): readonly [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

const f = (n: number) => Math.round(n * 100) / 100;

/** arco de círculo (sin relleno) entre dos ángulos, sentido horario */
export function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const [x0, y0] = polar(cx, cy, r, startDeg);
  const [x1, y1] = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${f(x0)} ${f(y0)} A ${r} ${r} 0 ${large} 1 ${f(x1)} ${f(y1)}`;
}

/** sector (porción de pastel) entre dos ángulos, sentido horario */
export function sector(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const [x0, y0] = polar(cx, cy, r, startDeg);
  const [x1, y1] = polar(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${f(x0)} ${f(y0)} A ${r} ${r} 0 ${large} 1 ${f(x1)} ${f(y1)} Z`;
}

/** parte el texto en líneas de ~maxChars sin cortar palabras (para <tspan>) */
export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if (line && (line + " " + w).length > maxChars) {
      lines.push(line);
      line = w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** flecha: devuelve trazo del astil y de la punta */
export function arrow(
  x0: number, y0: number, x1: number, y1: number, head = 9,
): { shaft: string; head: string } {
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const a1 = ang + Math.PI * 0.8;
  const a2 = ang - Math.PI * 0.8;
  const hx1 = x1 + head * Math.cos(a1);
  const hy1 = y1 + head * Math.sin(a1);
  const hx2 = x1 + head * Math.cos(a2);
  const hy2 = y1 + head * Math.sin(a2);
  return {
    shaft: `M ${f(x0)} ${f(y0)} L ${f(x1)} ${f(y1)}`,
    head: `M ${f(hx1)} ${f(hy1)} L ${f(x1)} ${f(y1)} L ${f(hx2)} ${f(hy2)}`,
  };
}
